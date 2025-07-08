// socket.js
import { io } from 'socket.io-client';

const socket = io('https://3b1d208aefe0.ngrok-free.app', {
  transports: ['websocket'],
});

export default socket;
