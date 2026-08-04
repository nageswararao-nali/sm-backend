"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const redis_client_1 = require("../src/common/redis/redis.client");
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const args = process.argv.slice(2);
const filterIdx = args.indexOf('--filter');
const filter = filterIdx !== -1 && args[filterIdx + 1] ? `*${args[filterIdx + 1]}*` : '*';
async function main() {
    const redis = (0, redis_client_1.createRedisClient)();
    try {
        const keys = await redis.keys(filter);
        if (keys.length === 0) {
            console.log(`No keys found matching "${filter}"`);
            return;
        }
        keys.sort();
        console.log(`\nFound ${keys.length} key(s) matching "${filter}":\n`);
        for (const key of keys) {
            const type = await redis.type(key);
            const ttl = await redis.ttl(key);
            let value;
            if (type === 'string') {
                const raw = await redis.get(key);
                try {
                    value = JSON.parse(raw);
                }
                catch (_a) {
                    value = raw;
                }
            }
            else if (type === 'list') {
                value = await redis.lrange(key, 0, -1);
            }
            else if (type === 'hash') {
                value = await redis.hgetall(key);
            }
            else if (type === 'set') {
                value = await redis.smembers(key);
            }
            else if (type === 'zset') {
                value = await redis.zrange(key, 0, -1, 'WITHSCORES');
            }
            console.log(`─── ${key}  [type: ${type}, ttl: ${ttl}s]`);
            console.log(JSON.stringify(value, null, 2));
            console.log();
        }
    }
    finally {
        redis.disconnect();
    }
}
main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=show-redis.js.map