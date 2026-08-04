"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = void 0;
const ioredis_1 = require("ioredis");
function createRedisClient() {
    return new ioredis_1.default({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB || 0),
    });
}
exports.createRedisClient = createRedisClient;
//# sourceMappingURL=redis.client.js.map