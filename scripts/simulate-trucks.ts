/**
 * Truck location simulator
 *
 * Picks up all accepted tours (current_status=2), fetches OSRM route for each,
 * and inserts simulated GPS locations into go_locations in real time.
 * Polls the DB every --poll seconds for newly accepted tours and starts
 * simulating them on the fly.
 *
 * Usage:
 *   ts-node scripts/simulate-trucks.ts
 *   ts-node scripts/simulate-trucks.ts --interval 1000 --poll 30 --env prod
 *
 * Timing modes:
 *   default (no --interval): each point waits exactly its OSRM segment duration (true real-time)
 *   --interval 0            : no waiting, runs as fast as possible
 *   --interval N            : fixed N ms between every point regardless of distance
 *
 * Stop completion:
 *   Once a stop is reached, the simulator waits for a manager to mark it complete in the portal.
 *   If that doesn't happen within --maxWaitPickupMin / --maxWaitDropMin minutes (default 20 each),
 *   it auto-completes the stop itself via the same updateSequence API.
 */

import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createRedisClient } from '../src/common/redis/redis.client';
import { getDigiPin } from 'digipinjs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const redis = createRedisClient();
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (name: string, fallback: string) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const ENV = getArg('env', process.env.ENV || 'test');
// -1 = use OSRM segment duration (default/real-time), 0 = no wait (fast), N = fixed ms
const INTERVAL_MS  = args.includes('--interval') ? parseInt(getArg('interval', '0')) : -1;
const POLL_SEC     = parseInt(getArg('poll', '30'));
// 1 = real-time, 2 = half the real time (2× faster), 3 = one-third the real time (3× faster)
const SPEED_FACTOR = parseFloat(getArg('speed', '1'));
// Max minutes to wait for a manager to mark a stop complete before the simulator auto-completes it
const MAX_WAIT_PICKUP_MS = parseFloat(getArg('maxWaitPickupMin', '20')) * 60 * 1000;
const MAX_WAIT_DROP_MS   = parseFloat(getArg('maxWaitDropMin', '20')) * 60 * 1000;
const OSRM_URL    = process.env.OSRM_URL || 'http://router.project-osrm.org';
const API_BASE    = ENV === 'prod'
    ? (process.env.PROD_API_BASE_URL || 'https://manager.goodmove.in')
    : (process.env.TEST_API_BASE_URL || 'https://test-manager.goodmove.in');

// ─── DB connection ───────────────────────────────────────────────────────────

const pool = new Pool({
    host:     ENV === 'prod' ? process.env.POSTGRES_HOST     : process.env.TEST_POSTGRES_HOST,
    port:     parseInt(process.env.POSTGRES_PORT || '5432'),
    user:     process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface Tour {
    id: number;
    driver_id: number;
    tour_date: string;
    tour_time: string;
    tour_type: string | null;
}

interface Waypoint {
    id: number;
    lat: number;
    lng: number;
    sequence_number: number;
    transport_type: string;
    booking_weight: number;
    booking_id: number;
    status: string | null;
    updated_at: string | null;
}

interface RoutePoint {
    lat: number;
    lng: number;
}

interface OsrmRoute {
    points: RoutePoint[];
    totalDuration: number;  // seconds — routes[0].duration from OSRM
}

// ─── State ───────────────────────────────────────────────────────────────────

const activeTourIds   = new Set<number>();
const activeDriverIds = new Set<number>();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(tourId: number | null, msg: string) {
    const prefix = tourId !== null ? `[Tour ${tourId}]` : '[Watcher]';
    console.log(`${new Date().toISOString()} ${prefix} ${msg}`);
}

function nowString(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// ─── DB queries ──────────────────────────────────────────────────────────────

async function fetchAvailableDriverIds(): Promise<number[]> {
    const result = await pool.query<{ id: number }>(
        `SELECT u.id
         FROM users u
         INNER JOIN drivers d ON d.user_id = u.id
         WHERE u.is_available = true`
    );
    return result.rows.map(r => r.id);
}

async function fetchTourForDriver(driverId: number): Promise<Tour | null> {
    log(driverId, `fetching tours for driver`);
    const result = await pool.query<Tour>(
        `SELECT id, driver_id, tour_date, tour_time, tour_type
         FROM tours
         WHERE driver_id = $1
           AND status = 'Accepted'
         ORDER BY id ASC
         LIMIT 1`,
        [driverId]
    );
    return result.rows[0] ?? null;
}

async function fetchVehicleCapacity(driverId: number): Promise<number> {
    const result = await pool.query(
        `SELECT t.capacity
         FROM drivers d
         JOIN trucks t ON t.id = d.truck_id
         WHERE d.user_id = $1
         LIMIT 1`,
        [driverId]
    );
    return result.rows[0]?.capacity ?? 0;
}

async function fetchDriverCurrentLocation(driverId: number): Promise<{ lat: number; lng: number } | null> {
    const result = await pool.query(
        `SELECT latitude::float AS lat, longitude::float AS lng
         FROM go_locations
         WHERE user_id = $1
           AND latitude IS NOT NULL
           AND longitude IS NOT NULL
         ORDER BY id DESC
         LIMIT 1`,
        [driverId]
    );
    return result.rows[0] ?? null;
}

async function callUpdateSequence(tourRouteId: number, status: string = 'Reached') {
    try {
        await axios.post(
            `${API_BASE}/tours/updateSequence`,
            { seqNum: [tourRouteId], status },
            { timeout: 5000 }
        );
    } catch (err) {
        log(null, `updateSequence failed for tour_route id ${tourRouteId}: ${(err as any).message}`);
    }
}

// Polls tour_route.status every POLL_STATUS_MS until it contains "Complete"
const POLL_STATUS_MS = 3000;

// While mid-leg (driving toward the next stop), re-check tour_route at most this often
const ROUTE_CHECK_MS = 5000;

async function waitUntilComplete(tourId: number, tourRouteId: number, transportType: string): Promise<void> {
    const label = transportType === 'pickup' ? 'Complete pickup' : 'Complete drop';
    const maxWaitMs = transportType === 'pickup' ? MAX_WAIT_PICKUP_MS : MAX_WAIT_DROP_MS;
    const start = Date.now();
    log(tourId, `Waiting for manager to mark stop ${tourRouteId} as "${label}" (auto-completing after ${(maxWaitMs / 60000).toFixed(1)} min)...`);

    while (true) {
        const result = await pool.query(
            `SELECT status FROM tour_route WHERE id = $1`,
            [tourRouteId]
        );
        const status: string = result.rows[0]?.status || '';
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

async function fetchTourRoute(tourId: number): Promise<Waypoint[]> {
    const result = await pool.query<Waypoint>(
        `SELECT tr.id,
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
         ORDER BY tr.sequence_number ASC`,
        [tourId]
    );
    return result.rows;
}

async function fetchNextLiveTourRoute(driverId: number, afterTourId: number): Promise<{ tourId: number; stops: any[] } | null> {
    const tourRes = await pool.query(
        `SELECT id FROM tours
         WHERE driver_id = $1
           AND id > $2
           AND (tour_type IS NULL OR tour_type != 'Dummy')
           AND status NOT IN ('Completed', 'Rejected')
         ORDER BY id ASC
         LIMIT 1`,
        [driverId, afterTourId]
    );
    const liveTour = tourRes.rows[0];
    if (!liveTour) return null;

    const routeRes = await pool.query(
        `SELECT tr.id,
                tr.booking_id,
                tr.sequence_number,
                tr.transport_type,
                tr.status,
                tr.updated_at
         FROM tour_route tr
         WHERE tr.tour_id = $1
           AND tr.location IS NOT NULL
         ORDER BY tr.sequence_number ASC`,
        [liveTour.id]
    );
    return { tourId: liveTour.id, stops: routeRes.rows };
}

async function refreshTourRouteInRedis(driverId: number, tourId: number, tourType: string | null): Promise<void> {
    let targetTourId = tourId;
    let rows: any[];

    if (tourType === 'Dummy') {
        const live = await fetchNextLiveTourRoute(driverId, tourId);
        if (live) {
            targetTourId = live.tourId;
            rows = live.stops;
        } else {
            return;
        }
    } else {
        const result = await pool.query(
            `SELECT tr.id,
                    tr.booking_id,
                    tr.sequence_number,
                    tr.transport_type,
                    tr.status,
                    tr.updated_at
             FROM tour_route tr
             WHERE tr.tour_id = $1
               AND tr.location IS NOT NULL
             ORDER BY tr.sequence_number ASC`,
            [tourId]
        );
        rows = result.rows;
    }

    await pushVehicleToRedis(driverId, {
        tour_route: rows.map((r: any) => ({
            tour_id:        targetTourId,
            id:             r.id,
            booking_id:     r.booking_id,
            sequence:       r.sequence_number,
            transport_type: r.transport_type,
            status:         r.status,
            updated_at:     r.updated_at,
        })),
    });
}

async function pushVehicleToRedis(driverId: number, patch: Partial<Record<string, any>>) {
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
    await redis.set(key, JSON.stringify({ ...base, ...patch }), 'EX', 36000);
}

async function pushInitialVehiclePayloads() {
    const driverIds = await fetchAvailableDriverIds();
    await Promise.all(driverIds.map(async (id) => {
        const [currentLoc, capacity] = await Promise.all([
            fetchDriverCurrentLocation(id),
            fetchVehicleCapacity(id)
        ]);
        await pushVehicleToRedis(id, {
            basePosition: currentLoc ?? null,
            capacity,
            latitude: currentLoc?.lat ?? null,
            longitude: currentLoc?.lng ?? null,
        });
    }));
    log(null, `Pushed initial payload for ${driverIds.length} available driver(s)`);
}

async function insertLocation(
    driverId: number, tourId: number,
    lat: number, lng: number,
    legIndex: number = 0, remainingSec: number = 0,
    currentLoad: number = 0
) {
    const locTime = nowString();
    const pointObject = JSON.stringify({ type: 'Point', coordinates: [lng, lat] });
    const currentPosition = getDigiPin(lat, lng).slice(-7);

    await Promise.all([
        pool.query(
            `INSERT INTO go_locations
                (user_id, tour_id, latitude, longitude, location, loc_time, is_distance_calculated)
             VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326)::geography, $6, false)`,
            [driverId, tourId, lat, lng, pointObject, locTime]
        ),
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

// ─── OSRM ────────────────────────────────────────────────────────────────────

async function getOsrmRoute(waypoints: Waypoint[]): Promise<OsrmRoute> {
    if (waypoints.length < 2) return { points: [], totalDuration: 0 };
    const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
    const url = `${OSRM_URL}/route/v1/driving/${coords}?geometries=geojson&overview=full`;
    const response = await axios.get(url, { timeout: 10000 });
    const route = response.data?.routes?.[0];
    if (!route) throw new Error('No route returned from OSRM');

    const points: RoutePoint[] = (route.geometry.coordinates as Array<[number, number]>)
        .map(([lng, lat]) => ({ lat, lng }));

    return { points, totalDuration: route.duration };
}

// ─── Per-tour simulation ──────────────────────────────────────────────────────

async function simulateTour(tour: Tour) {
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
        let waypoints: Waypoint[] = currentLoc
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
                    tour_route: live.stops.map((s: any) => ({
                        tour_id:        live.tourId,
                        id:             s.id,
                        booking_id:     s.booking_id,
                        sequence:       s.sequence_number,
                        transport_type: s.transport_type,
                        status:         s.status,
                        updated_at:     s.updated_at,
                    })),
                });
            }
        } else {
            await pushVehicleToRedis(tour.driver_id, {
                tour_id: tour.id,
                tour_route: tourStops.map(s => ({
                    tour_id:        tour.id,
                    id:             s.id,
                    booking_id:     s.booking_id,
                    sequence:       s.sequence_number,
                    transport_type: s.transport_type,
                    status:         s.status,
                    updated_at:     s.updated_at,
                })),
            });
        }

        // Simulate leg by leg: one OSRM call per consecutive waypoint pair
        let w = 0;
        while (w < waypoints.length - 1) {
            // Check tour status AND driver availability before each leg
            const check = await pool.query(
                `SELECT t.status, u.is_available
                 FROM tours t
                 JOIN drivers d ON d.user_id = t.driver_id
                 JOIN users   u ON u.id      = d.user_id
                 WHERE t.id = $1`,
                [tour.id]
            );
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

            // Re-fetch live tour_route — picks up stops added/removed/reordered after the tour started
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
            const to   = waypoints[w + 1];

            log(tour.id, `Leg ${w + 1}/${waypoints.length - 1}: calling OSRM (${from.transport_type} → ${to.transport_type})...`);
            const { points, totalDuration: rawDuration } = await getOsrmRoute([from, to]);
            const totalDuration = rawDuration / SPEED_FACTOR;
            log(tour.id, `Leg ${w + 1}: ${points.length} points, ETA ${Math.round(totalDuration)}s (speed=${SPEED_FACTOR}x)`);

            // Elapsed-time loop for this leg's route points
            const startedAt = Date.now();
            let lastInsertedIdx = -1;
            let lastRouteCheckAt = Date.now();
            let rerouted = false;

            while (true) {
                const tickStart = Date.now();

                const elapsedSec  = (tickStart - startedAt) / 1000;
                const progress    = Math.min(elapsedSec / totalDuration, 1);
                const targetIdx   = Math.min(
                    Math.floor(progress * points.length),
                    points.length - 1
                );

                // Insert all points from last position up to targetIdx
                const remainingSec = Math.max(0, totalDuration - elapsedSec);
                for (let i = lastInsertedIdx + 1; i <= targetIdx; i++) {
                    await insertLocation(tour.driver_id, tour.id, points[i].lat, points[i].lng, w, remainingSec, currentLoad);
                }
                lastInsertedIdx = targetIdx;

                // Mid-leg check: a long leg (e.g. real-time mode) can take minutes —
                // re-check tour_route periodically instead of only between legs
                if (tickStart - lastRouteCheckAt >= ROUTE_CHECK_MS) {
                    lastRouteCheckAt = tickStart;
                    const midFreshStops = await fetchTourRoute(tour.id);
                    const midFreshIds   = midFreshStops.map(s => s.id).join(',');
                    const midPlannedIds = waypoints.slice(w + 1).map(s => s.id).join(',');
                    if (midFreshIds !== midPlannedIds) {
                        const curPt = points[lastInsertedIdx] ?? from;
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

                if (progress >= 1) break;

                // Sleep remaining tick time to avoid drift
                const tickElapsed = Date.now() - tickStart;
                const remaining   = Math.max(0, INTERVAL_MS - tickElapsed);
                if (remaining > 0) await sleep(remaining);
            }

            if (rerouted) continue; // recompute this leg from the new current-position waypoint

            // Notify backend that this tour_route stop has been reached
            // Skip id=0 which is the synthetic driver current-position entry
            if (to.id > 0) {
                await callUpdateSequence(to.id);
                await refreshTourRouteInRedis(tour.driver_id, tour.id, tour.tour_type);
                await waitUntilComplete(tour.id, to.id, to.transport_type);
                // Update load: pickup adds weight, dropoff removes it
                if (to.transport_type === 'pickup') {
                    currentLoad += to.booking_weight;
                } else {
                    currentLoad = Math.max(0, currentLoad - to.booking_weight);
                }
                log(tour.id, `Stop ${w + 1} complete (${to.transport_type}), current load: ${currentLoad}`);
            } else {
                log(tour.id, `Leg ${w + 1} complete — reached stop ${w + 1} (${to.transport_type})`);
            }
            w++;
        }

        log(tour.id, `All legs complete — simulation done`);
    } catch (err) {
        log(tour.id, `Error: ${(err as any).message}`);
    } finally {
        activeTourIds.delete(tour.id);
        activeDriverIds.delete(tour.driver_id);

        // Immediately check if driver still has another tour — don't wait for next watcher poll
        try {
            const availableIds = await fetchAvailableDriverIds();
            if (availableIds.includes(tour.driver_id)) {
                const nextTour = await fetchTourForDriver(tour.driver_id);
                if (nextTour && !activeTourIds.has(nextTour.id)) {
                    log(tour.id, `Driver ${tour.driver_id} has next tour ${nextTour.id} — spawning`);
                    simulateTour(nextTour).catch(err =>
                        log(nextTour.id, `Unhandled error: ${(err as any).message}`)
                    );
                }
            }
        } catch (_) {}
    }
}

// ─── Tour watcher ─────────────────────────────────────────────────────────────

async function watchForNewTours() {
    log(null, `Polling available drivers every ${POLL_SEC}s...`);

    while (true) {
        try {
            const driverIds = await fetchAvailableDriverIds();

            await Promise.all(driverIds.map(async (id) => {
                const exists = await redis.exists(`veh:live:${id}`);
                if (!exists) {
                    const [currentLoc, capacity] = await Promise.all([
                        fetchDriverCurrentLocation(id),
                        fetchVehicleCapacity(id)
                    ]);
                    await pushVehicleToRedis(id, {
                        basePosition: currentLoc ?? null,
                        capacity,
                        latitude: currentLoc?.lat ?? null,
                        longitude: currentLoc?.lng ?? null,
                    });
                    log(null, `Pushed vehicle details to Redis for new driver ${id}`);
                }
            }));

            const idleDriverIds = driverIds.filter(id => !activeDriverIds.has(id));

            for (const driverId of idleDriverIds) {
                const tour = await fetchTourForDriver(driverId);
                if (!tour) continue;
                if (activeTourIds.has(tour.id)) continue;

                log(null, `Driver ${driverId} has tour ${tour.id} — spawning simulation`);
                simulateTour(tour).catch(err =>
                    log(tour.id, `Unhandled error: ${(err as any).message}`)
                );
            }

            log(null, `Active tours: [${[...activeTourIds].join(', ') || 'none'}]`);
        } catch (err) {
            log(null, `Poll error: ${(err as any).message}`);
        }

        await sleep(POLL_SEC * 1000);
    }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

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

    // Verify DB connection
    await pool.query('SELECT 1');
    console.log('DB connected.\n');

    // Push initial Redis payload (tour_id=0, load=0) for all available drivers
    await pushInitialVehiclePayloads();

    // Start the watcher — runs forever
    await watchForNewTours();
}

main().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
