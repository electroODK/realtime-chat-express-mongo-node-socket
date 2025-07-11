import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';

import userRoutes from './routes/user.routes.js';
import groupRoutes from './routes/group.routes.js';
import messageRoutes from './routes/message.routes.js';

import { initSocket } from './utils/socket.js';
dotenv.config();

const app = express();
app.use(cors({ origin: '*' , credentials: true }));

app.use(express.json());

const server = http.createServer(app);
initSocket(server);

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 4545;

connectDB().then(() => {
  console.log('mongoDB connected');

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
