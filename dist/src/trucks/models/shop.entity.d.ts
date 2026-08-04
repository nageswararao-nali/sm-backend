import { Point } from "geojson";
export declare class ShopsEntity {
    id: number;
    contact_number: string;
    shop_name: string;
    address: string;
    shop_type: string;
    qr_url: string;
    status: string;
    latitude: string;
    longitude: string;
    location: Point;
    created_at: Date;
    updated_at: Date;
}
