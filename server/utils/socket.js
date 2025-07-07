// socket.js
import { Server } from 'socket.io';
import MessageModel from '../models/message.model.js';
import GroupModel from '../models/group.model.js';
import VideoChatModel from '../models/videochat.model.js';

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
      console.log(`User joined group ${groupId}`);
    });

    socket.on('sendMessage', async (message) => {
      try {
        const { groupId, text, userId, time } = message;

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

    // ==== Видео-комната ====
    socket.on('join-video-room', async (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', socket.id);
      console.log(`User ${socket.id} joined video room ${roomId}`);

      // при первом входе в комнату — создать запись в БД
      try {
        const existing = await VideoChatModel.findOne({
          groupId: roomId,
          endedAt: null,
        });

        if (!existing) {
          await VideoChatModel.create({
            groupId: roomId,
            participants: [],
          });
        }
      } catch (err) {
        console.error('Ошибка создания видеочата в БД:', err.message);
      }
    });

    socket.on('leave-video-room', async (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
      console.log(`User ${socket.id} left video room ${roomId}`);

      // закрыть текущий видеочат
      try {
        await VideoChatModel.findOneAndUpdate(
          { groupId: roomId, endedAt: null },
          { endedAt: new Date() }
        );
      } catch (err) {
        console.error('Ошибка закрытия видеочата:', err.message);
      }
    });

    socket.on('video-signal', ({ to, from, signal }) => {
      io.to(to).emit('video-signal', { from, signal });
    });

    // ==== Отключение ====
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
