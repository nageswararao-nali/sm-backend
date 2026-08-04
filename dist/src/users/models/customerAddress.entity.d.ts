import { Point } from "geojson";
export declare class CustomerAddressEntity {
    id: number;
    address: string;
    address_type: string;
    city: string;
    state: string;
    country: string;
    customer_id: number;
    latitude: string;
    longitude: string;
    location: Point;
    mobile: string;
    pincode: string;
    receiver_contact: string;
    receiver_name: string;
    is_live: boolean;
    created_by: number;
    created_at: Date;
    updated_by: number;
    updated_at: Date;
}
