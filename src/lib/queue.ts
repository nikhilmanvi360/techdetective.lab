import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => console.log('[REDIS] Connected to Redis at', REDIS_URL));
connection.on('error', (err) => console.error('[REDIS] Connection Error:', err.message));

export const codeExecutionQueue = new Queue('code-execution', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const codeExecutionEvents = new QueueEvents('code-execution', {
  connection,
});
