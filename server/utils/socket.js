import { Server } from 'socket.io';
import MessageModel from '../models/message.model.js';
import GroupModel from '../models/group.model.js';

let io;

const usersInRoom = {}; // { roomId: [socketId, ...] }

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

    // ==== Видео-комната ====
    socket.on('join-video-room', ({ roomId, userId }) => {
      if (!roomId || !userId) {
        console.warn('⚠️ join-video-room: Некорректные данные');
        return;
      }

      socket.join(roomId);
      console.log(`📹 ${userId} (${socket.id}) joined room ${roomId}`);

      // Регистрируем юзера в комнате
      if (!usersInRoom[roomId]) {
        usersInRoom[roomId] = [];
      }

      // Отправляем новому пользователю список остальных
      const otherUsers = usersInRoom[roomId].filter((id) => id !== socket.id);
      socket.emit('all-users', otherUsers);

      usersInRoom[roomId].push(socket.id);

      // Оповещаем остальных о новом юзере
      socket.to(roomId).emit('user-connected', {
        socketId: socket.id,
        userId,
      });
    });

    socket.on('signal', ({ to, from, signal }) => {
      io.to(to).emit('signal', { from, signal });
    });

    socket.on('disconnecting', () => {
      const rooms = [...socket.rooms].filter((r) => r !== socket.id);

      rooms.forEach((roomId) => {
        socket.to(roomId).emit('user-disconnected', socket.id);

        if (usersInRoom[roomId]) {
          usersInRoom[roomId] = usersInRoom[roomId].filter((id) => id !== socket.id);

          // Если в комнате больше никого — удалить ключ
          if (usersInRoom[roomId].length === 0) {
            delete usersInRoom[roomId];
          }
        }
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
