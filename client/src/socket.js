// socket.js
import { io } from 'socket.io-client';

const socket = io('https://your-url.ngrok-free.app', {
  transports: ['websocket'],
});

export default socket;
