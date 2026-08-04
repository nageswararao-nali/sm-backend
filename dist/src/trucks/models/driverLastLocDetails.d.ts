import { Point } from "geojson";
export declare class DriverLastLocationDetails {
    id: number;
    driver_id: number;
    truck_id: number;
    vehicle_type: string;
    latitude: string;
    longitude: string;
    location: Point;
    last_tracked_at: string;
}
