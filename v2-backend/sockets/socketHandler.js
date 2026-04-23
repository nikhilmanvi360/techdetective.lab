import GameRoom from '../models/GameRoom.js';

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Join a game room
    socket.on('join_room', async ({ roomCode, userId }) => {
      try {
        const room = await GameRoom.findOne({ roomCode }).populate('players', 'username');
        if (room) {
          socket.join(roomCode);
          console.log(`[SOCKET] User ${userId} joined room: ${roomCode}`);
          
          // Notify others in the room
          socket.to(roomCode).emit('player_joined', {
            userId,
            username: room.players.find(p => p._id.toString() === userId)?.username || 'Someone'
          });
          
          // Send current room data back to joiner
          socket.emit('room_data', room);
        }
      } catch (error) {
        console.error(`[SOCKET ERROR] ${error.message}`);
      }
    });

    // Start game trigger
    socket.on('start_game', async ({ roomCode }) => {
      try {
        const room = await GameRoom.findOne({ roomCode });
        if (room) {
          room.status = 'playing';
          await room.save();
          io.to(roomCode).emit('game_started', { startTime: Date.now() });
        }
      } catch (error) {
        console.error(`[SOCKET ERROR] ${error.message}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });
};
