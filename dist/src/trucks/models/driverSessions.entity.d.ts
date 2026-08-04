export declare class DriverSessionsEntity {
    id: number;
    user_id: number;
    start_location: string;
    end_location: string;
    status: boolean;
    created_at: Date;
    session_start_time: Date;
    session_end_time: Date;
    updated_at: Date;
    start_odometer_reading: number;
    end_odometer_reading: number;
    start_odometer_photo: string;
    end_odometer_photo: string;
    start_buffer_time: number;
    end_buffer_time: number;
    total_time: string;
    total_distance: string;
    parent_session_id: number;
    is_closed_session: boolean;
    paid: boolean;
    fare: number;
    final_fare: number;
    notes: string;
}
