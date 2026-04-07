const redis = require('../config/redis');

const SELECTION_TTL = 30; // seconds — short lock just for seat map display

module.exports = function seatHandlers(io, socket) {

  socket.on('join:event', (eventId) => {
    socket.join(`event:${eventId}`);
    console.log(`${socket.user.sub} joined event:${eventId}`);
  });

  socket.on('leave:event', (eventId) => {
    socket.leave(`event:${eventId}`);
  });

  socket.on('seat:select', async ({ seatId, eventId, sessionId }) => {
    if (!seatId || !eventId) return;

    // Set a short Redis lock so booking service sees it as locked
    const lockKey = `seat:${seatId}:lock`;
    const acquired = await redis.set(
      lockKey,
      socket.user.sub,
      'NX',
      'EX',
      SELECTION_TTL
    );

    if (!acquired) {
      // Seat already locked by someone else — tell this client only
      socket.emit('seat:lock_failed', { seatId });
      return;
    }

    // Broadcast to everyone else in this event room
    socket.to(`event:${eventId}`).emit('seat:update', {
      seatId,
      status:     'friend',
      occupiedBy: {
        id:   socket.user.sub,
        name: socket.user.displayName,
      },
    });
  });

  socket.on('seat:deselect', async ({ seatId, eventId }) => {
    if (!seatId || !eventId) return;

    // Only release lock if this user owns it
    const lockKey = `seat:${seatId}:lock`;
    const owner   = await redis.get(lockKey);
    if (owner === socket.user.sub.toString()) {
      await redis.del(lockKey);
    }

    socket.to(`event:${eventId}`).emit('seat:update', {
      seatId,
      status: 'available',
    });
  });

  // Clean up all seat selections when user disconnects mid-selection
  socket.on('disconnect', async () => {
    // This is a best-effort cleanup — Redis TTL handles it anyway
    // but this makes the seat map update immediately on disconnect
    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room.startsWith('event:')) {
        socket.to(room).emit('seats:presence_left', {
          userId: socket.user.sub,
        });
      }
    }
  });

};