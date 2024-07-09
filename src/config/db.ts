import Redis from 'ioredis';

const redisConnection: Redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
});

redisConnection.on('connect', () => {
    console.log('Connected to Redis');
});
redisConnection.on('error', (err) => {
    console.error('Redis connection error:', err);
});

export default redisConnection;
