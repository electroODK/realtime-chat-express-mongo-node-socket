export const handleSignal = (io, socket) => {
  socket.on('video-signal', ({ to, from, signal }) => {
    io.to(to).emit('video-signal', { from, signal });
  });

  socket.on('join-video-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('leave-video-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
  });
};
