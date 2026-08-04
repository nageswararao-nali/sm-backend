/// <reference types="multer" />
import { UsersService } from 'src/users/services/users.service';
import { DriverService } from '../services/driver.service';
import { TruckService } from '../services/truck.service';
export declare class DriverController {
    private driverService;
    private usersService;
    private truckService;
    constructor(driverService: DriverService, usersService: UsersService, truckService: TruckService);
    addDriver(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addOwner(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateOwner(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteOwner(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getOwners(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriver(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getOwner(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateDriver(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteDriver(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDrivers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverDetails(reqBody: any): Promise<{
        success: boolean;
        message: string;
        data: {};
    }>;
    getDriverSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateDriverSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverSessions(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getAllSessions(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    createSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateSession(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteSession(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addTruckerRate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateTruckerRate(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    truckersRateList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverPaymentCalculation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendInactiveNotification(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateAvailable(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updateAvailableById(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    calculateSessionFare(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    updateSessionFare(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    payDriverFare(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverTransactions(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverCumulativeEarnings(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    autoSessionClose(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverMonthlyFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverSessionSummary(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calculateSessionFareManual(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getDriverSessionSummary(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calculateDriverFareById(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverSummaryReport(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverSummaryMetrix(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
