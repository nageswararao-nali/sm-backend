/// <reference types="multer" />
import { AdminService } from '../services/admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    addConsolidationCenter(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getConsolidationCenters(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCategories(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendNotification(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendSingleInvoice(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendBulkInvoice(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendFlipkartBulkInvoice(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendCustomerNotifications(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addBaseLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBaseLocations(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    editBaseLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendNotificationToUsers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendNotificationToAll(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getPortalSettings(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addPortalSetting(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    editPortalSetting(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    bookDemo(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
