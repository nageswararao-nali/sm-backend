import { Point } from "geojson";
export declare class SpecialAddressEntity {
    id: number;
    address: string;
    city: string;
    state: string;
    country: string;
    latitude: string;
    longitude: string;
    location: Point;
    amount: number;
    created_at: Date;
    updated_at: Date;
}
