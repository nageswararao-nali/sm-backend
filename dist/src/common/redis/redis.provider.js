"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisProvider = exports.REDIS_CLIENT = void 0;
const redis_client_1 = require("./redis.client");
exports.REDIS_CLIENT = 'REDIS_CLIENT';
exports.RedisProvider = {
    provide: exports.REDIS_CLIENT,
    useFactory: () => {
        const client = (0, redis_client_1.createRedisClient)();
        client.on('connect', () => console.log('Redis connected'));
        client.on('error', (err) => console.error('Redis error:', err.message));
        return client;
    },
};
//# sourceMappingURL=redis.provider.js.map