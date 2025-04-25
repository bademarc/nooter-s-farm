# syntax = docker/dockerfile:1

# Use the official Node.js 20 image.
# https://hub.docker.com/_/node
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js (Noot.io Backend)"

# Set working directory *inside* the backend folder within the image
WORKDIR /app/backend

# Copy backend package files ONLY into the WORKDIR
COPY backend/package.json backend/package-lock.json* ./
# Allow package-lock.json to be optional

# Install backend dependencies ONLY using npm
# Use --omit=dev to avoid installing devDependencies
RUN npm install --omit=dev

# Copy the backend server code explicitly into the WORKDIR (/app/backend)
COPY backend/server.js ./server.js

# Expose the port the app listens on (8080)
EXPOSE 8080

# Run the backend server using the server.js inside the workdir (/app/backend)
CMD [ "node", "server.js" ]
