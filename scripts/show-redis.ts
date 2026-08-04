/**
 * Displays all keys and values stored in Redis.
 *
 * Usage:
 *   ts-node scripts/show-redis.ts
 *   ts-node scripts/show-redis.ts --filter truck    (show only keys matching pattern)
 *   ts-node scripts/show-redis.ts --filter booking
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createRedisClient } from '../src/common/redis/redis.client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args      = process.argv.slice(2);
const filterIdx = args.indexOf('--filter');
const filter    = filterIdx !== -1 && args[filterIdx + 1] ? `*${args[filterIdx + 1]}*` : '*';

async function main() {
    const redis = createRedisClient();

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
            const ttl  = await redis.ttl(key);

            let value: any;
            if (type === 'string') {
                const raw = await redis.get(key);
                try { value = JSON.parse(raw); } catch { value = raw; }
            } else if (type === 'list') {
                value = await redis.lrange(key, 0, -1);
            } else if (type === 'hash') {
                value = await redis.hgetall(key);
            } else if (type === 'set') {
                value = await redis.smembers(key);
            } else if (type === 'zset') {
                value = await redis.zrange(key, 0, -1, 'WITHSCORES');
            }

            console.log(`─── ${key}  [type: ${type}, ttl: ${ttl}s]`);
            console.log(JSON.stringify(value, null, 2));
            console.log();
        }
    } finally {
        redis.disconnect();
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
