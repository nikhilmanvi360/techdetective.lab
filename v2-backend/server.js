import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/database.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';

// Socket handler
import { socketHandler } from './sockets/socketHandler.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Tech Detective Lab API is running...');
});

// Initialize Sockets
socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[SERVER] Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
