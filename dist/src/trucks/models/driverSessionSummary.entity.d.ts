export declare class DriverSessionSummaryEntity {
    id: number;
    user_id: number;
    driver_name: string;
    session_date: string;
    created_at: Date;
    session_ids: string;
    updated_at: Date;
    total_time: number;
    total_revenue: number;
    total_distance: string;
    paid: boolean;
    fare: number;
    notes: string;
    local_trips: number;
    long_haul_trips: number;
}
