import { io } from '../../server';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export type GameState = 'LOBBY' | 'ROUND_1' | 'ROUND_2' | 'FINAL' | 'COMPLETED';

interface RoomState {
  currentState: GameState;
  timer: number; // seconds remaining
  lastUpdated: number;
}

const TRANSITIONS: Record<GameState, GameState[]> = {
  LOBBY: ['ROUND_1'],
  ROUND_1: ['ROUND_2', 'COMPLETED'],
  ROUND_2: ['FINAL', 'COMPLETED'],
  FINAL: ['COMPLETED'],
  COMPLETED: ['LOBBY'],
};

const DURATIONS: Record<GameState, number> = {
  LOBBY: 0,
  ROUND_1: 600, // 10 minutes
  ROUND_2: 900, // 15 minutes
  FINAL: 300,   // 5 minutes
  COMPLETED: 0,
};

export class GameStateManager {
  private static intervals = new Map<string, NodeJS.Timeout>();

  static async getRoomState(roomCode: string): Promise<RoomState> {
    const data = await redis.get(`room:${roomCode}:state`);
    if (data) return JSON.parse(data);
    
    return {
      currentState: 'LOBBY',
      timer: 0,
      lastUpdated: Date.now(),
    };
  }

  static async transition(roomCode: string, nextState: GameState) {
    const state = await this.getRoomState(roomCode);
    
    // Validate Transition
    if (!TRANSITIONS[state.currentState].includes(nextState)) {
      throw new Error(`Invalid transition from ${state.currentState} to ${nextState}`);
    }

    const newState: RoomState = {
      currentState: nextState,
      timer: DURATIONS[nextState],
      lastUpdated: Date.now(),
    };

    await redis.set(`room:${roomCode}:state`, JSON.stringify(newState));
    
    // Broadcast Update
    io.to(roomCode).emit('game_state_update', newState);
    
    // Manage Timers
    this.stopTimer(roomCode);
    if (newState.timer > 0) {
      this.startTimer(roomCode);
    }

    console.log(`[GAME ENGINE] Room ${roomCode} transitioned to ${nextState}`);
  }

  private static startTimer(roomCode: string) {
    const interval = setInterval(async () => {
      const state = await this.getRoomState(roomCode);
      if (state.timer > 0) {
        state.timer -= 1;
        await redis.set(`room:${roomCode}:state`, JSON.stringify(state));
        io.to(roomCode).emit('game_timer_update', { secondsRemaining: state.timer });
      } else {
        // Auto-transition or stop
        this.stopTimer(roomCode);
        io.to(roomCode).emit('game_timer_expired', { state: state.currentState });
      }
    }, 1000);

    this.intervals.set(roomCode, interval);
  }

  private static stopTimer(roomCode: string) {
    const existing = this.intervals.get(roomCode);
    if (existing) {
      clearInterval(existing);
      this.intervals.delete(roomCode);
    }
  }

  static async handleEdgeCases(roomCode: string) {
     // Handle player disconnects or room timeouts here
  }
}
