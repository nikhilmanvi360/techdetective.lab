import express from 'express';
import { createRoom, joinRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);

export default router;
