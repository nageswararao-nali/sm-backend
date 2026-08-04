import { Point } from "geojson";
export declare class TourRouteEntity {
    id: number;
    tour_id: number;
    booking_id: number;
    trip_id: string;
    transport_type: string;
    consolidation_center_id: number;
    sequence_number: number;
    location_address: string;
    location: Point;
    status: string;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
    tour_type: string;
    is_to_base: boolean;
    estimated_time: string;
    completed_time: string;
}
