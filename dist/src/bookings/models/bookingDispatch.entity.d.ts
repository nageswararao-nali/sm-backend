export declare class BookingDispatchEntity {
    id: number;
    multi_booking_id: string;
    status: string;
    winner_driver_id: number;
    winner_truck_id: number;
    winner_truck_owner_id: number;
    tour_id: number;
    created_at: Date;
    expires_at: Date;
}
