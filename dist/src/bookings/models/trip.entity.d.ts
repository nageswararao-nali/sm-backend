import { Point } from "geojson";
import { BookingEntity } from "./booking.entity";
export declare class TripEntity {
    id: number;
    customer_id: number;
    booking_id: number;
    trip_id: string;
    driver_id: number;
    tour_id: number;
    engaged_consolidation_manager: number;
    pickup_location: string;
    pickup_time: string;
    dropoff_location: string;
    dropoff_time: string;
    status: string;
    pickup_lat: string;
    pickup_long: string;
    dropoff_lat: string;
    dropoff_long: string;
    pickup_point: Point;
    dropoff_point: Point;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
    booking: BookingEntity;
}
