export declare class BookingConsolidationCentersEntity {
    id: number;
    unique_id: string;
    booking_id: number;
    drop_at: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_time: string;
    dropoff_time: string;
    tour_assign: number;
    booking_at_consolidation_center_tour_status: string;
    pickup_lat: string;
    pickup_long: string;
    dropoff_lat: string;
    dropoff_long: string;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
}
