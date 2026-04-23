import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processCodeExecution } from './processor.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

console.log('[WORKER] Code Execution Service starting...');

const worker = new Worker(
  'code-execution',
  async (job) => {
    console.log(`[WORKER] Processing Job #${job.id} for Team ${job.data.teamId}`);
    return await processCodeExecution(job.data);
  },
  { 
    connection,
    concurrency: 5, // Process up to 5 scripts at once
  }
);

worker.on('completed', (job) => {
  console.log(`[WORKER] Job #${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job #${job?.id} failed: ${err.message}`);
});

process.on('SIGTERM', async () => {
  console.log('[WORKER] Shutting down...');
  await worker.close();
});
