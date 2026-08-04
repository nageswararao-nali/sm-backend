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
exports.ShopService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const shop_entity_1 = require("../models/shop.entity");
const utils_service_1 = require("../../utils/services/utils.service");
const config_1 = require("@nestjs/config");
var QRCode = require('qrcode');
var fs = require("fs");
let ShopService = class ShopService {
    constructor(shopsRepo, utilsService, configService) {
        this.shopsRepo = shopsRepo;
        this.utilsService = utilsService;
        this.configService = configService;
        this.minlUrl = '';
        this.qrCodeBucket = '';
        this.qrCodeUrl = '';
        this.addShop = async (reqBody) => {
            const pointObject = {
                type: "Point",
                coordinates: [reqBody.longitude, reqBody.latitude]
            };
            const shopInput = {
                "contact_number": reqBody.contact_number,
                "shop_name": reqBody.shop_name,
                "latitude": reqBody.latitude,
                "longitude": reqBody.longitude,
                "address": reqBody.address,
                "shop_type": reqBody.shop_type,
                "status": "Active",
                "location": pointObject
            };
            const shopData = await this.shopsRepo.save(shopInput);
            const qr_url = this.minlUrl + shopData.id;
            const qr_code_url = this.qrCodeUrl + shopData.id + '.png';
            let qrResp = await QRCode.toDataURL(qr_url);
            const base64Data = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const type = qrResp.split(';')[0].split('/')[1];
            let params = {
                Bucket: this.qrCodeBucket,
                Key: `${shopData.id}.${type}`,
                Body: base64Data,
                ACL: 'public-read',
                ContentEncoding: 'base64',
                ContentType: `image/${type}`
            };
            const fileRes = await this.utilsService.uploadS3(params);
            const shopUpdate = await this.shopsRepo.update({ id: shopData.id }, { qr_url: qr_code_url });
            console.log("shop updating ...");
            console.log(shopUpdate);
            return shopData;
        };
        this.minlUrl = process.env.ENV == 'test' ? this.configService.get('TEST_MINL_URL') : this.configService.get('PROD_MINL_URL');
        this.qrCodeBucket = process.env.ENV == 'test' ? this.configService.get('TEST_QR_CODES_BUCKET_NAME') : this.configService.get('PROD_QR_CODES_BUCKET_NAME');
        this.qrCodeUrl = process.env.ENV == 'test' ? this.configService.get('TEST_QR_CODE_URL') : this.configService.get('PROD_QR_CODE_URL');
    }
    async createQrCodeForShop(reqBody) {
        const shopData = await this.shopsRepo.findOneBy({ id: reqBody.shop_id });
        const qr_url = this.minlUrl + shopData.id;
        const qr_code_url = this.qrCodeUrl + shopData.id + '.png';
        let qrResp = await QRCode.toDataURL(qr_url);
        const base64Data = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = qrResp.split(';')[0].split('/')[1];
        let params = {
            Bucket: this.qrCodeBucket,
            Key: `${shopData.id}.${type}`,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: `image/${type}`
        };
        const fileRes = await this.utilsService.uploadS3(params);
        const shopUpdate = await this.shopsRepo.update({ id: shopData.id }, { qr_url: qr_code_url });
        return shopUpdate;
    }
    async createQrCodeForGeneralBooking(reqBody) {
        const qr_url = 'https://minl.app/delhi';
        const qr_code_url = this.qrCodeUrl + 'delhi_general.png';
        let qrResp = await QRCode.toDataURL(qr_url);
        const base64Data = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = qrResp.split(';')[0].split('/')[1];
        let params = {
            Bucket: this.qrCodeBucket,
            Key: `delhi_general.${type}`,
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64',
            ContentType: `image/${type}`
        };
        const fileRes = await this.utilsService.uploadS3(params);
        console.log(fileRes);
        return qr_code_url;
    }
    async getShopDetailsById(shop_id) {
        const shopData = await this.shopsRepo.findOneBy({ id: shop_id });
        return shopData;
    }
    async getShops(shop_id) {
        const [items, count] = await this.shopsRepo.findAndCount({ order: { id: 'DESC' } });
        return { items, count };
    }
    async updateShop(id, reqBody) {
        delete reqBody.mobile_number;
        const shopData = await this.shopsRepo.update({ id: id }, reqBody);
        return shopData;
    }
    async deleteShop(id) {
        const shopData = await this.shopsRepo.delete(id);
        return shopData;
    }
};
ShopService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.ShopsEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        utils_service_1.UtilsService,
        config_1.ConfigService])
], ShopService);
exports.ShopService = ShopService;
//# sourceMappingURL=shop.service.js.map