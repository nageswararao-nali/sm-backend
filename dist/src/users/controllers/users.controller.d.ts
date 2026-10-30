import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Users } from '../models/users.interface';
import { UsersService } from '../services/users.service';
export declare class UsersController {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    getUsers(): Promise<Observable<Users[]>>;
    sendOtp(reqBody: any): Promise<Observable<any>> | any;
    verifyOtp(reqBody: any): Promise<any> | {
        type: string;
    };
    checkUser(reqBody: any): Promise<any>;
    register(reqBody: any): Promise<any>;
    profileUpdate(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllCustomers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getRegularCustomers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    userDetails(reqBody: any): Promise<{
        success: boolean;
        message: string;
        data: {};
    }>;
    updateStatus(reqBody: any): Promise<{
        success: boolean;
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
    addAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateAddress(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteAddress(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteAddresses(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getAddressById(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCustomerAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateDeviceToken(reqBody: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getNotifications(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    viewNotification(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getAllCompanies(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tagCutomerToCompany(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getUnassignedCustomers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addCustomerCompany(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCustomersByIds(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendNotificationToAll(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addSpecialAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkLiveAddress(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
