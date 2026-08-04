export interface Tours {
    id?: number;
    tour_date?: string;
    tour_time?: string;
    tour_fare?: string;
    manager_status?: string;
    truck_owner_status?: string;
    truck_owner_id?: number;
    manager_accept_truck_owner?: string;
    assign_truck_driver_screen_status?: string;
    assign_truck_driver_screen_status_time?: string;
    engaged_consolidation_manager?: string;
    sequence?: string;
    created_by?: number;
    created_at?: Date;
    updated_by?: number;
    updated_at?: Date;
}
