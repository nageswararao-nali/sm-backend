/**
 * Clears booking:* and truck:* keys from Redis.
 *
 * Usage:
 *   ts-node scripts/clear-redis.ts            (clears both)
 *   ts-node scripts/clear-redis.ts --bookings (clears only booking:* keys)
 *   ts-node scripts/clear-redis.ts --trucks   (clears only truck:* keys)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createRedisClient } from '../src/common/redis/redis.client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args         = process.argv.slice(2);
const onlyBookings = args.includes('--bookings');
const onlyTrucks   = args.includes('--trucks');

const patterns: string[] = onlyBookings ? ['booking:*']
                         : onlyTrucks   ? ['veh:live:*']
                         : ['booking:*', 'veh:live:*', 'bookings:status:Assigned', 'veh:bookings:*'];

async function deleteByPattern(redis: any, pattern: string): Promise<number> {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
}

async function main() {
    const redis = createRedisClient();

    try {
        let total = 0;
        for (const pattern of patterns) {
            const count = await deleteByPattern(redis, pattern);
            console.log(`Deleted ${count} key(s) matching "${pattern}"`);
            total += count;
        }
        console.log(`\nTotal deleted: ${total} key(s)`);
    } finally {
        redis.disconnect();
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
