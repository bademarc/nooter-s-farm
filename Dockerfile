# syntax = docker/dockerfile:1

# Use the official Node.js 20 image.
# https://hub.docker.com/_/node
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js (Noot.io Backend)"

# Set working directory *inside* the backend/server folder within the image
WORKDIR /app/backend/server

# Copy backend package files ONLY into the /app/backend directory first
# This assumes the package.json relevant to the server is in /backend, not /backend/server
COPY backend/package.json backend/package-lock.json* /app/backend/
# Allow package-lock.json to be optional

# Install backend dependencies ONLY using npm in the /app/backend directory
# Use --omit=dev to avoid installing devDependencies
RUN npm install --prefix /app/backend --omit=dev

# Copy the specific backend server code into the WORKDIR (/app/backend/server)
COPY backend/server/ ./ 

# Copy necessary config if it's outside backend/server (adjust path as needed)
# Example: If config.js is in /app/backend
COPY backend/config.js /app/backend/config.js

# Ensure Node can find modules installed in the parent directory
ENV NODE_PATH=/app/backend/node_modules

# Expose the port the app listens on (8080)
EXPOSE 8080

# Run the backend server using the server.js inside the workdir (/app/backend/server)
CMD [ "node", "server.js" ]
