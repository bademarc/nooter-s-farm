# syntax = docker/dockerfile:1

# Use the official Node.js 20 image.
# https://hub.docker.com/_/node
ARG NODE_VERSION=20.19.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js (Noot.io Server)"

# Set working directory
WORKDIR /app

# Install pnpm globally (optional, keeping for consistency)
# ARG PNPM_VERSION=10.9.0
# RUN npm install -g pnpm@$PNPM_VERSION

# Copy package files from the root
COPY package.json package-lock.json* ./ 
# Allow package-lock.json to be optional

# Install dependencies using npm
RUN npm install --omit=dev

# Copy the server code from the root
COPY server.js .

# Expose the port the app listens on (8080)
EXPOSE 8080

# Run the backend server
CMD [ "node", "server.js" ]
