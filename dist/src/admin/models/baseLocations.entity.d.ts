import { Point } from "geojson";
export declare class BaseLocationsEntity {
    id: number;
    unique_id: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zip_code: string;
    latitude: string;
    longitude: string;
    location: Point;
    is_main_base: boolean;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
}
