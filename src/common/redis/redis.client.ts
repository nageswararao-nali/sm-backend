import Redis from 'ioredis';

export function createRedisClient(): Redis {
    return new Redis({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB || 0),
    });
}
