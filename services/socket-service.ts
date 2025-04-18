// services/socket-service.ts

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectToServer = () => {
  if (!socket) {
    socket = io('http://localhost:3001'); // Use your server URL in production
  }
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectFromServer = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};