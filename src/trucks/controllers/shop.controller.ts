import { Body, ConsoleLogger, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ShopService } from '../services/shop.service';

@Controller('shop')
export class ShopsController {
    constructor(
        private shopService: ShopService
    ){}

    @Post('addShop')
    async addShop(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.shopService.addShop(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
        
        
    }

    @Post('getShopDetails')
    async getShopDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking found'
        }
        const shopData = await this.shopService.getShopDetailsById(reqBody.shop_id)
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        } else {
            response.data = shopData
        }
        return response
    }

    @Post('getShops')
    async getShops(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        }
        const shopData = await this.shopService.getShops(reqBody.shop_id)
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        } else {
            response.data = shopData
        }
        return response
    }

    @Post('updateShop/:id')
    async updateShop(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const shopData = await this.shopService.updateShop(id, reqBody)
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        } else {
            response.data = shopData
        }
        return response
        
    }

    @Post('deleteShop/:id')
    async deleteShop(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const shopData = await this.shopService.deleteShop(id)
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        } else {
            response.data = shopData
        }
        return response
        
    }

    @Post('createQrCodeForShop')
    async createQrCodeForShop(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        }
        const shopData = await this.shopService.createQrCodeForShop(reqBody)
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        } else {
            response.data = shopData
        }
        return response
    }
    
    @Post('createQrCodeForGeneralBooking')
    async createQrCodeForGeneralBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        }
        const shopData = await this.shopService.createQrCodeForGeneralBooking(reqBody)
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        } else {
            response.data = shopData
        }
        return response
    }
    

}
