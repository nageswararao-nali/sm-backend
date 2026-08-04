"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopsController = void 0;
const common_1 = require("@nestjs/common");
const shop_service_1 = require("../services/shop.service");
let ShopsController = class ShopsController {
    constructor(shopService) {
        this.shopService = shopService;
    }
    async addShop(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.shopService.addShop(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async getShopDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking found'
        };
        const shopData = await this.shopService.getShopDetailsById(reqBody.shop_id);
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
    async getShops(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        };
        const shopData = await this.shopService.getShops(reqBody.shop_id);
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
    async updateShop(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const shopData = await this.shopService.updateShop(id, reqBody);
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
    async deleteShop(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const shopData = await this.shopService.deleteShop(id);
        if (!shopData) {
            response.success = false;
            response.message = "Shop not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
    async createQrCodeForShop(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        };
        const shopData = await this.shopService.createQrCodeForShop(reqBody);
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
    async createQrCodeForGeneralBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Shops found'
        };
        const shopData = await this.shopService.createQrCodeForGeneralBooking(reqBody);
        if (!shopData) {
            response.success = false;
            response.message = "Shops not found";
        }
        else {
            response.data = shopData;
        }
        return response;
    }
};
__decorate([
    (0, common_1.Post)('addShop'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "addShop", null);
__decorate([
    (0, common_1.Post)('getShopDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "getShopDetails", null);
__decorate([
    (0, common_1.Post)('getShops'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "getShops", null);
__decorate([
    (0, common_1.Post)('updateShop/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "updateShop", null);
__decorate([
    (0, common_1.Post)('deleteShop/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "deleteShop", null);
__decorate([
    (0, common_1.Post)('createQrCodeForShop'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "createQrCodeForShop", null);
__decorate([
    (0, common_1.Post)('createQrCodeForGeneralBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ShopsController.prototype, "createQrCodeForGeneralBooking", null);
ShopsController = __decorate([
    (0, common_1.Controller)('shop'),
    __metadata("design:paramtypes", [shop_service_1.ShopService])
], ShopsController);
exports.ShopsController = ShopsController;
//# sourceMappingURL=shop.controller.js.map