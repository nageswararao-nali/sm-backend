import { Point } from "geojson";
export declare class LocationsEntity {
    id: number;
    user_id: number;
    session_id: number;
    tour_id: number;
    latitude: string;
    longitude: string;
    location: Point;
    created_at: Date;
    loc_time: string;
    is_distance_calculated: boolean;
}
