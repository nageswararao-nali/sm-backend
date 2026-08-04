"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
const redis_client_1 = require("../src/common/redis/redis.client");
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const args = process.argv.slice(2);
const onlyBookings = args.includes('--bookings');
const onlyTrucks = args.includes('--trucks');
const patterns = onlyBookings ? ['booking:*']
    : onlyTrucks ? ['veh:live:*']
        : ['booking:*', 'veh:live:*', 'bookings:status:Assigned', 'veh:bookings:*'];
async function deleteByPattern(redis, pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length === 0)
        return 0;
    await redis.del(...keys);
    return keys.length;
}
async function main() {
    const redis = (0, redis_client_1.createRedisClient)();
    try {
        let total = 0;
        for (const pattern of patterns) {
            const count = await deleteByPattern(redis, pattern);
            console.log(`Deleted ${count} key(s) matching "${pattern}"`);
            total += count;
        }
        console.log(`\nTotal deleted: ${total} key(s)`);
    }
    finally {
        redis.disconnect();
    }
}
main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
//# sourceMappingURL=clear-redis.js.map