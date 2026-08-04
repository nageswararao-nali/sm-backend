import { DataService } from '../services/data.service';
export declare class DataController {
    private dataService;
    constructor(dataService: DataService);
    updateGMRates(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateCompanyData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    feedSpecialAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateMultiBookingId(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    cTimeUpdates(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingTimes(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    formBookingData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    feedCompanyAddressRates(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
