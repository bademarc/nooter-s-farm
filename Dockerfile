# syntax = docker/dockerfile:1

# Use the official Node.js 20 image.
# https://hub.docker.com/_/node
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js (Noot.io Backend)"

# Set working directory for backend
WORKDIR /app/backend

# Install pnpm globally (optional, but can be useful if needed by backend scripts)
ARG PNPM_VERSION=10.9.0
RUN npm install -g pnpm@$PNPM_VERSION

# Copy backend package files
COPY backend/package.json backend/pnpm-lock.yaml* ./ 
# Allow pnpm-lock.yaml to be optional initially

# Install backend dependencies using npm (simpler for basic backend)
# If you want to use pnpm for backend: RUN pnpm install --prod
RUN npm install --omit=dev

# Copy the rest of the backend code
COPY backend/ .

# Expose the port the app listens on (should match PORT in server.js)
EXPOSE 8080

# Run the backend server
CMD [ "node", "server.js" ]
