import { Repository } from 'typeorm';
import { ShopsEntity } from '../models/shop.entity';
import { UtilsService } from 'src/utils/services/utils.service';
import { ConfigService } from '@nestjs/config';
export declare class ShopService {
    private shopsRepo;
    private utilsService;
    private configService;
    minlUrl: string;
    qrCodeBucket: string;
    qrCodeUrl: string;
    constructor(shopsRepo: Repository<ShopsEntity>, utilsService: UtilsService, configService: ConfigService);
    addShop: (reqBody: any) => Promise<any>;
    createQrCodeForShop(reqBody: any): Promise<any>;
    createQrCodeForGeneralBooking(reqBody: any): Promise<any>;
    getShopDetailsById(shop_id: number): Promise<any>;
    getShops(shop_id: number): Promise<any>;
    updateShop(id: number, reqBody: any): Promise<any>;
    deleteShop(id: number): Promise<any>;
}
