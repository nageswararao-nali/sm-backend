"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const pg_1 = require("pg");
const dotenv = require("dotenv");
const path = require("path");
const redis_client_1 = require("../src/common/redis/redis.client");
const digipinjs_1 = require("digipinjs");
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const redis = (0, redis_client_1.createRedisClient)();
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};
const ENV = getArg('env', process.env.ENV || 'test');
const INTERVAL_MS = args.includes('--interval') ? parseInt(getArg('interval', '0')) : -1;
const POLL_SEC = parseInt(getArg('poll', '30'));
const SPEED_FACTOR = parseFloat(getArg('speed', '1'));
const MAX_WAIT_PICKUP_MS = parseFloat(getArg('maxWaitPickupMin', '20')) * 60 * 1000;
const MAX_WAIT_DROP_MS = parseFloat(getArg('maxWaitDropMin', '20')) * 60 * 1000;
const OSRM_URL = process.env.OSRM_URL || 'http://router.project-osrm.org';
const API_BASE = ENV === 'prod'
    ? (process.env.PROD_API_BASE_URL || 'https://manager.goodmove.in')
    : (process.env.TEST_API_BASE_URL || 'https://test-manager.goodmove.in');
const pool = new pg_1.Pool({
    host: ENV === 'prod' ? process.env.POSTGRES_HOST : process.env.TEST_POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
});
const activeTourIds = new Set();
const activeDriverIds = new Set();
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function log(tourId, msg) {
    const prefix = tourId !== null ? `[Tour ${tourId}]` : '[Watcher]';
    console.log(`${new Date().toISOString()} ${prefix} ${msg}`);
}
function nowString() {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
}
async function fetchAvailableDriverIds() {
    const result = await pool.query(`SELECT u.id
         FROM users u
         INNER JOIN drivers d ON d.user_id = u.id
         WHERE u.is_available = true`);
    return result.rows.map(r => r.id);
}
async function fetchTourForDriver(driverId) {
    var _a;
    log(driverId, `fetching tours for driver`);
    const result = await pool.query(`SELECT id, driver_id, tour_date, tour_time, tour_type
         FROM tours
         WHERE driver_id = $1
           AND status = 'Accepted'
         ORDER BY id ASC
         LIMIT 1`, [driverId]);
    return (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null;
}
async function fetchVehicleCapacity(driverId) {
    var _a, _b;
    const result = await pool.query(`SELECT t.capacity
         FROM drivers d
         JOIN trucks t ON t.id = d.truck_id
         WHERE d.user_id = $1
         LIMIT 1`, [driverId]);
    return (_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.capacity) !== null && _b !== void 0 ? _b : 0;
}
async function fetchDriverCurrentLocation(driverId) {
    var _a;
    const result = await pool.query(`SELECT latitude::float AS lat, longitude::float AS lng
         FROM go_locations
         WHERE user_id = $1
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
         ORDER BY id DESC
         LIMIT 1`, [driverId]);
    return (_a = result.rows[0]) !== null && _a !== void 0 ? _a : null;
}
async function callUpdateSequence(tourRouteId, status = 'Reached') {
    try {
        await axios_1.default.post(`${API_BASE}/tours/updateSequence`, { seqNum: [tourRouteId], status }, { timeout: 5000 });
    }
    catch (err) {
        log(null, `updateSequence failed for tour_route id ${tourRouteId}: ${err.message}`);
    }
}
const POLL_STATUS_MS = 3000;
const ROUTE_CHECK_MS = 5000;
async function waitUntilComplete(tourId, tourRouteId, transportType) {
    var _a;
    const label = transportType === 'pickup' ? 'Complete pickup' : 'Complete drop';
    const maxWaitMs = transportType === 'pickup' ? MAX_WAIT_PICKUP_MS : MAX_WAIT_DROP_MS;
    const start = Date.now();
    log(tourId, `Waiting for manager to mark stop ${tourRouteId} as "${label}" (auto-completing after ${(maxWaitMs / 60000).toFixed(1)} min)...`);
    while (true) {
        const result = await pool.query(`SELECT status FROM tour_route WHERE id = $1`, [tourRouteId]);
        const status = ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.status) || '';
        if (status.toLowerCase().startsWith('complete')) {
            log(tourId, `Stop ${tourRouteId} marked "${status}" — proceeding to next leg`);
            return;
        }
        if (Date.now() - start >= maxWaitMs) {
            log(tourId, `Stop ${tourRouteId} not marked complete after ${(maxWaitMs / 60000).toFixed(1)} min — auto-completing "${label}"`);
            await callUpdateSequence(tourRouteId, 'Completed');
            return;
        }
        await sleep(POLL_STATUS_MS);
    }
}
async function fetchTourRoute(tourId) {
    const result = await pool.query(`SELECT tr.id,
                tr.booking_id,
                tr.sequence_number,
                tr.transport_type,
                tr.status,
                tr.updated_at,
                ST_Y(tr.location::geometry) AS lat,
                ST_X(tr.location::geometry) AS lng,
                COALESCE(b.commodity_weight, 0) AS booking_weight
         FROM tour_route tr
         LEFT JOIN bookings b ON b.id = tr.booking_id
         WHERE tr.tour_id = $1
           AND tr.location IS NOT NULL
           AND (tr.status IS NULL OR tr.status NOT ILIKE 'Complete%')
         ORDER BY tr.sequence_number ASC`, [tourId]);
    return result.rows;
}
async function fetchNextLiveTourRoute(driverId, afterTourId) {
    const tourRes = await pool.query(`SELECT id FROM tours
         WHERE driver_id = $1
           AND id > $2
           AND (tour_type IS NULL OR tour_type != 'Dummy')
           AND status NOT IN ('Completed', 'Rejected')
         ORDER BY id ASC
         LIMIT 1`, [driverId, afterTourId]);
    const liveTour = tourRes.rows[0];
    if (!liveTour)
        return null;
    const routeRes = await pool.query(`SELECT tr.id,
                tr.booking_id,
                tr.sequence_number,
                tr.transport_type,
                tr.status,
                tr.updated_at
         FROM tour_route tr
         WHERE tr.tour_id = $1
           AND tr.location IS NOT NULL
         ORDER BY tr.sequence_number ASC`, [liveTour.id]);
    return { tourId: liveTour.id, stops: routeRes.rows };
}
async function refreshTourRouteInRedis(driverId, tourId, tourType) {
    let targetTourId = tourId;
    let rows;
    if (tourType === 'Dummy') {
        const live = await fetchNextLiveTourRoute(driverId, tourId);
        if (live) {
            targetTourId = live.tourId;
            rows = live.stops;
        }
        else {
            return;
        }
    }
    else {
        const result = await pool.query(`SELECT tr.id,
                    tr.booking_id,
                    tr.sequence_number,
                    tr.transport_type,
                    tr.status,
                    tr.updated_at
             FROM tour_route tr
             WHERE tr.tour_id = $1
               AND tr.location IS NOT NULL
             ORDER BY tr.sequence_number ASC`, [tourId]);
        rows = result.rows;
    }
    await pushVehicleToRedis(driverId, {
        tour_route: rows.map((r) => ({
            tour_id: targetTourId,
            id: r.id,
            booking_id: r.booking_id,
            sequence: r.sequence_number,
            transport_type: r.transport_type,
            status: r.status,
            updated_at: r.updated_at,
        })),
    });
}
async function pushVehicleToRedis(driverId, patch) {
    const key = `veh:live:${driverId}`;
    const existing = await redis.get(key);
    const base = existing ? JSON.parse(existing) : {
        id: driverId,
        driver_id: driverId,
        vehicle_id: driverId,
        tour_id: 0,
        basePosition: null,
        route: [],
        currentPosition: '',
        currentLegIndex: 0,
        remainingLegSeconds: 0,
        capacity: 0,
        weight: 0,
        volume: 0,
        latitude: null,
        longitude: null,
        created_at: new Date(),
        vehiclePath: [],
        completedRoute: []
    };
    await redis.set(key, JSON.stringify(Object.assign(Object.assign({}, base), patch)), 'EX', 36000);
}
async function pushInitialVehiclePayloads() {
    const driverIds = await fetchAvailableDriverIds();
    await Promise.all(driverIds.map(async (id) => {
        var _a, _b;
        const [currentLoc, capacity] = await Promise.all([
            fetchDriverCurrentLocation(id),
            fetchVehicleCapacity(id)
        ]);
        await pushVehicleToRedis(id, {
            basePosition: currentLoc !== null && currentLoc !== void 0 ? currentLoc : null,
            capacity,
            latitude: (_a = currentLoc === null || currentLoc === void 0 ? void 0 : currentLoc.lat) !== null && _a !== void 0 ? _a : null,
            longitude: (_b = currentLoc === null || currentLoc === void 0 ? void 0 : currentLoc.lng) !== null && _b !== void 0 ? _b : null,
        });
    }));
    log(null, `Pushed initial payload for ${driverIds.length} available driver(s)`);
}
async function insertLocation(driverId, tourId, lat, lng, legIndex = 0, remainingSec = 0, currentLoad = 0) {
    const locTime = nowString();
    const pointObject = JSON.stringify({ type: 'Point', coordinates: [lng, lat] });
    const currentPosition = (0, digipinjs_1.getDigiPin)(lat, lng).slice(-7);
    await Promise.all([
        pool.query(`INSERT INTO go_locations
                (user_id, tour_id, latitude, longitude, location, loc_time, is_distance_calculated)
             VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)::geography, $6, false)`, [driverId, tourId, lat, lng, pointObject, locTime]),
        pushVehicleToRedis(driverId, {
            tour_id: tourId,
            currentPosition,
            currentLegIndex: legIndex,
            remainingLegSeconds: Math.round(remainingSec),
            weight: currentLoad,
            volume: currentLoad,
            latitude: lat,
            longitude: lng
        })
    ]);
}
async function getOsrmRoute(waypoints) {
    var _a, _b;
    if (waypoints.length < 2)
        return { points: [], totalDuration: 0 };
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const url = `${OSRM_URL}/route/v1/driving/${coords}?geometries=geojson&overview=full`;
    const response = await axios_1.default.get(url, { timeout: 10000 });
    const route = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.routes) === null || _b === void 0 ? void 0 : _b[0];
    if (!route)
        throw new Error('No route returned from OSRM');
    const points = route.geometry.coordinates
        .map(([lng, lat]) => ({ lat, lng }));
    return { points, totalDuration: route.duration };
}
async function simulateTour(tour) {
    var _a;
    activeTourIds.add(tour.id);
    activeDriverIds.add(tour.driver_id);
    log(tour.id, `Starting simulation for driver ${tour.driver_id}`);
    try {
        const tourStops = await fetchTourRoute(tour.id);
        if (tourStops.length < 1) {
            log(tour.id, `No tour stops found — skipping`);
            activeTourIds.delete(tour.id);
            return;
        }
        let currentLoad = 0;
        const currentLoc = await fetchDriverCurrentLocation(tour.driver_id);
        let waypoints = currentLoc
            ? [{ id: 0, lat: currentLoc.lat, lng: currentLoc.lng, sequence_number: 0, transport_type: 'current', booking_weight: 0, booking_id: 0, status: null, updated_at: null }, ...tourStops]
            : tourStops;
        if (waypoints.length < 2) {
            log(tour.id, `Not enough waypoints to route — skipping`);
            activeTourIds.delete(tour.id);
            return;
        }
        log(tour.id, `${currentLoc ? 'Driver location prepended.' : 'No current location, starting from first stop.'} ${tourStops.length} tour stops to simulate.`);
        if (tour.tour_type === 'Dummy') {
            const live = await fetchNextLiveTourRoute(tour.driver_id, tour.id);
            if (live) {
                await pushVehicleToRedis(tour.driver_id, {
                    tour_route: live.stops.map((s) => ({
                        tour_id: live.tourId,
                        id: s.id,
                        booking_id: s.booking_id,
                        sequence: s.sequence_number,
                        transport_type: s.transport_type,
                        status: s.status,
                        updated_at: s.updated_at,
                    })),
                });
            }
        }
        else {
            await pushVehicleToRedis(tour.driver_id, {
                tour_id: tour.id,
                tour_route: tourStops.map(s => ({
                    tour_id: tour.id,
                    id: s.id,
                    booking_id: s.booking_id,
                    sequence: s.sequence_number,
                    transport_type: s.transport_type,
                    status: s.status,
                    updated_at: s.updated_at,
                })),
            });
        }
        let w = 0;
        while (w < waypoints.length - 1) {
            const check = await pool.query(`SELECT t.status, u.is_available
                 FROM tours t
                 JOIN drivers d ON d.user_id = t.driver_id
                 JOIN users   u ON u.id      = d.user_id
                 WHERE t.id = $1`, [tour.id]);
            const row = check.rows[0];
            if (!row) {
                log(tour.id, `Tour not found — stopping simulation`);
                return;
            }
            if (['Completed', 'Rejected'].includes(row.status)) {
                log(tour.id, `Tour status is "${row.status}" — stopping simulation`);
                return;
            }
            if (!row.is_available) {
                log(tour.id, `Driver ${tour.driver_id} is no longer available — stopping simulation`);
                return;
            }
            const freshStops = await fetchTourRoute(tour.id);
            const remainingIds = waypoints.slice(w + 1).map(s => s.id).join(',');
            const freshIds = freshStops.map(s => s.id).join(',');
            if (remainingIds !== freshIds) {
                log(tour.id, `Tour route changed mid-trip — was [${remainingIds}], now [${freshIds}] — rerouting`);
                waypoints = [...waypoints.slice(0, w + 1), ...freshStops];
                await refreshTourRouteInRedis(tour.driver_id, tour.id, tour.tour_type);
            }
            if (w + 1 >= waypoints.length) {
                log(tour.id, `No stops remaining after route update — ending simulation`);
                break;
            }
            const from = waypoints[w];
            const to = waypoints[w + 1];
            log(tour.id, `Leg ${w + 1}/${waypoints.length - 1}: calling OSRM (${from.transport_type} → ${to.transport_type})...`);
            const { points, totalDuration: rawDuration } = await getOsrmRoute([from, to]);
            const totalDuration = rawDuration / SPEED_FACTOR;
            log(tour.id, `Leg ${w + 1}: ${points.length} points, ETA ${Math.round(totalDuration)}s (speed=${SPEED_FACTOR}x)`);
            const startedAt = Date.now();
            let lastInsertedIdx = -1;
            let lastRouteCheckAt = Date.now();
            let rerouted = false;
            while (true) {
                const tickStart = Date.now();
                const elapsedSec = (tickStart - startedAt) / 1000;
                const progress = Math.min(elapsedSec / totalDuration, 1);
                const targetIdx = Math.min(Math.floor(progress * points.length), points.length - 1);
                const remainingSec = Math.max(0, totalDuration - elapsedSec);
                for (let i = lastInsertedIdx + 1; i <= targetIdx; i++) {
                    await insertLocation(tour.driver_id, tour.id, points[i].lat, points[i].lng, w, remainingSec, currentLoad);
                }
                lastInsertedIdx = targetIdx;
                if (tickStart - lastRouteCheckAt >= ROUTE_CHECK_MS) {
                    lastRouteCheckAt = tickStart;
                    const midFreshStops = await fetchTourRoute(tour.id);
                    const midFreshIds = midFreshStops.map(s => s.id).join(',');
                    const midPlannedIds = waypoints.slice(w + 1).map(s => s.id).join(',');
                    if (midFreshIds !== midPlannedIds) {
                        const curPt = (_a = points[lastInsertedIdx]) !== null && _a !== void 0 ? _a : from;
                        log(tour.id, `Tour route changed mid-leg — was [${midPlannedIds}], now [${midFreshIds}] — rerouting from current position`);
                        waypoints = [
                            ...waypoints.slice(0, w),
                            { id: 0, lat: curPt.lat, lng: curPt.lng, sequence_number: from.sequence_number, transport_type: 'current', booking_weight: 0, booking_id: 0, status: null, updated_at: null },
                            ...midFreshStops,
                        ];
                        await refreshTourRouteInRedis(tour.driver_id, tour.id, tour.tour_type);
                        rerouted = true;
                        break;
                    }
                }
                if (progress >= 1)
                    break;
                const tickElapsed = Date.now() - tickStart;
                const remaining = Math.max(0, INTERVAL_MS - tickElapsed);
                if (remaining > 0)
                    await sleep(remaining);
            }
            if (rerouted)
                continue;
            if (to.id > 0) {
                await callUpdateSequence(to.id);
                await refreshTourRouteInRedis(tour.driver_id, tour.id, tour.tour_type);
                await waitUntilComplete(tour.id, to.id, to.transport_type);
                if (to.transport_type === 'pickup') {
                    currentLoad += to.booking_weight;
                }
                else {
                    currentLoad = Math.max(0, currentLoad - to.booking_weight);
                }
                log(tour.id, `Stop ${w + 1} complete (${to.transport_type}), current load: ${currentLoad}`);
            }
            else {
                log(tour.id, `Leg ${w + 1} complete — reached stop ${w + 1} (${to.transport_type})`);
            }
            w++;
        }
        log(tour.id, `All legs complete — simulation done`);
    }
    catch (err) {
        log(tour.id, `Error: ${err.message}`);
    }
    finally {
        activeTourIds.delete(tour.id);
        activeDriverIds.delete(tour.driver_id);
        try {
            const availableIds = await fetchAvailableDriverIds();
            if (availableIds.includes(tour.driver_id)) {
                const nextTour = await fetchTourForDriver(tour.driver_id);
                if (nextTour && !activeTourIds.has(nextTour.id)) {
                    log(tour.id, `Driver ${tour.driver_id} has next tour ${nextTour.id} — spawning`);
                    simulateTour(nextTour).catch(err => log(nextTour.id, `Unhandled error: ${err.message}`));
                }
            }
        }
        catch (_) { }
    }
}
async function watchForNewTours() {
    log(null, `Polling available drivers every ${POLL_SEC}s...`);
    while (true) {
        try {
            const driverIds = await fetchAvailableDriverIds();
            await Promise.all(driverIds.map(async (id) => {
                var _a, _b;
                const exists = await redis.exists(`veh:live:${id}`);
                if (!exists) {
                    const [currentLoc, capacity] = await Promise.all([
                        fetchDriverCurrentLocation(id),
                        fetchVehicleCapacity(id)
                    ]);
                    await pushVehicleToRedis(id, {
                        basePosition: currentLoc !== null && currentLoc !== void 0 ? currentLoc : null,
                        capacity,
                        latitude: (_a = currentLoc === null || currentLoc === void 0 ? void 0 : currentLoc.lat) !== null && _a !== void 0 ? _a : null,
                        longitude: (_b = currentLoc === null || currentLoc === void 0 ? void 0 : currentLoc.lng) !== null && _b !== void 0 ? _b : null,
                    });
                    log(null, `Pushed vehicle details to Redis for new driver ${id}`);
                }
            }));
            const idleDriverIds = driverIds.filter(id => !activeDriverIds.has(id));
            for (const driverId of idleDriverIds) {
                const tour = await fetchTourForDriver(driverId);
                if (!tour)
                    continue;
                if (activeTourIds.has(tour.id))
                    continue;
                log(null, `Driver ${driverId} has tour ${tour.id} — spawning simulation`);
                simulateTour(tour).catch(err => log(tour.id, `Unhandled error: ${err.message}`));
            }
            log(null, `Active tours: [${[...activeTourIds].join(', ') || 'none'}]`);
        }
        catch (err) {
            log(null, `Poll error: ${err.message}`);
        }
        await sleep(POLL_SEC * 1000);
    }
}
async function main() {
    console.log(`
=== Truck Location Simulator ===
  ENV:      ${ENV}
  DB host:  ${ENV === 'prod' ? process.env.POSTGRES_HOST : process.env.TEST_POSTGRES_HOST}
  OSRM:     ${OSRM_URL}
  interval: ${INTERVAL_MS === -1 ? 'OSRM segment duration (real-time)' : INTERVAL_MS === 0 ? 'no wait (fast)' : `${INTERVAL_MS}ms fixed`}
  poll:     every ${POLL_SEC}s for new tours
================================
`);
    await pool.query('SELECT 1');
    console.log('DB connected.\n');
    await pushInitialVehiclePayloads();
    await watchForNewTours();
}
main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
//# sourceMappingURL=simulate-trucks.js.map