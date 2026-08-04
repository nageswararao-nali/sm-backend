export declare class DriversEntity {
    id: number;
    truck_owner_id: number;
    truck_id: number;
    user_id: number;
    name: string;
    mobile_number: string;
    license_number: string;
    license_proof: string;
    status: string;
    soft_delete: number;
    scheme_name: string;
    wallet: number;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
    is_darkroom: boolean;
    last_tracked_at: Date;
    last_notification_at: Date;
}
