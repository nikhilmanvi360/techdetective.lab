import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
