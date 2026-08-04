import { Point } from "geojson";
export declare class UserLoginsEntity {
    id: number;
    user_id: number;
    login_latitude: string;
    login_longitude: string;
    login_location: Point;
    logout_latitude: string;
    logout_longitude: string;
    logout_location: Point;
    log_date: string;
    loggedin_time: string;
    loggedout_time: string;
    created_at: Date;
}
