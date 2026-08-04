import { createRedisClient } from './redis.client';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider = {
    provide: REDIS_CLIENT,
    useFactory: () => {
        const client = createRedisClient();
        client.on('connect', () => console.log('Redis connected'));
        client.on('error', (err) => console.error('Redis error:', err.message));
        return client;
    },
};
