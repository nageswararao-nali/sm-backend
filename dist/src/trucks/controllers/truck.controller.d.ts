import { TruckService } from '../services/truck.service';
export declare class TruckController {
    private truckService;
    constructor(truckService: TruckService);
    getTruckDetails(truckId: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getTruck(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    truckByOwner(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverByOwner(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addTruck(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateTruck(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteTruck(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getTrucks(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
