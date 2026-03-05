import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socketInstance = null;

export const connectSocket = (token) => {
  if (!token) return null;
  if (socketInstance?.connected) return socketInstance;

  if (socketInstance) {
    socketInstance.disconnect();
  }

  socketInstance = io(API_BASE_URL, {
    transports: ['websocket'],
    auth: {
      token
    }
  });

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
