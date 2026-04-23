import GameRoom from '../models/GameRoom.js';

// @desc    Create new room
// @route   POST /api/rooms/create
export const createRoom = async (req, res) => {
  try {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = await GameRoom.create({
      roomCode,
      host: req.user._id,
      players: [req.user._id]
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Join room
// @route   POST /api/rooms/join
export const joinRoom = async (req, res) => {
  const { roomCode } = req.body;
  try {
    const room = await GameRoom.findOne({ roomCode });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already in progress' });
    }

    if (!room.players.includes(req.user._id)) {
      room.players.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
