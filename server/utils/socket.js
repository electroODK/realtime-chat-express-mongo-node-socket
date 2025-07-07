// socket.js
import { Server } from 'socket.io';
import MessageModel from '../models/message.model.js';
import GroupModel from '../models/group.model.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('🟢 Client connected:', socket.id);

    // ==== Чат-комната ====
    socket.on('joinGroup', (groupId) => {
      socket.join(groupId);
      console.log(`User ${socket.id} joined chat group ${groupId}`);
    });

    socket.on('sendMessage', async (message) => {
      try {
        const { groupId, text, userId } = message;

        const newMsg = await MessageModel.create({
          text,
          groupId,
          sender: userId,
        });

        await GroupModel.findByIdAndUpdate(groupId, {
          $push: { messages: newMsg._id },
        });

        io.to(groupId).emit('newMessage', {
          ...message,
          _id: newMsg._id,
        });
      } catch (error) {
        console.error('Ошибка при сохранении сообщения:', error.message);
      }
    });

    // ==== Видео-комната (без инициатора, многопользовательская) ====
    socket.on('join-video-room', ({ roomId, userId }) => {
      socket.join(roomId);
      console.log(`📹 User ${userId} (${socket.id}) joined video room ${roomId}`);

      // Оповестить других о новом участнике
      socket.to(roomId).emit('user-connected', { socketId: socket.id, userId });
    });

    socket.on('signal', ({ to, from, signal }) => {
      io.to(to).emit('signal', { from, signal });
    });

    socket.on('leave-video-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-disconnected', socket.id);
      console.log(`📴 User ${socket.id} left video room ${roomId}`);
    });

    socket.on('disconnecting', () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);
      rooms.forEach((roomId) => {
        socket.to(roomId).emit('user-disconnected', socket.id);
      });
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io не инициализирован!');
  }
  return io;
};
