import mongoose from 'mongoose';

const gameRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting',
  }
}, { timestamps: true });

export default mongoose.model('GameRoom', gameRoomSchema);
