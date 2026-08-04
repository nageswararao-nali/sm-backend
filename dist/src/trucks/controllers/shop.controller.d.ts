import { ShopService } from '../services/shop.service';
export declare class ShopsController {
    private shopService;
    constructor(shopService: ShopService);
    addShop(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getShopDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getShops(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateShop(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteShop(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    createQrCodeForShop(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    createQrCodeForGeneralBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
