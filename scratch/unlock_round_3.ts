import IORedis from 'ioredis';
import 'dotenv/config';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

async function unlockRound3() {
  const roomCode = 'GLOBAL'; // Assuming a default or global room code if applicable
  const newState = {
    currentState: 'ROUND_3',
    timer: 4680, // 78 minutes
    lastUpdated: Date.now(),
  };

  await redis.set(`room:${roomCode}:state`, JSON.stringify(newState));
  console.log(`[TEST] Force-unlocked ROUND_3 for room: ${roomCode}`);
  
  // Also initialize Round3Manager state if needed (though it defaults correctly)
  process.exit(0);
}

unlockRound3().catch(err => {
  console.error(err);
  process.exit(1);
});
