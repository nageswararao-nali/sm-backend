import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Not, Repository } from 'typeorm';
import * as moment from 'moment';
import { ShopsEntity } from '../models/shop.entity';
import { Point } from 'geojson';
import { UtilsService } from 'src/utils/services/utils.service';
import { ConfigService } from '@nestjs/config';
var QRCode = require('qrcode')
var fs = require("fs")

@Injectable()
export class ShopService {
    minlUrl = ''
    qrCodeBucket = ''
    qrCodeUrl = ''
    constructor(
        @InjectRepository(ShopsEntity)
        private shopsRepo: Repository<ShopsEntity>,
        private utilsService: UtilsService,
        private configService: ConfigService
    ){
        this.minlUrl = process.env.ENV == 'test' ? this.configService.get('TEST_MINL_URL') : this.configService.get('PROD_MINL_URL')
        this.qrCodeBucket = process.env.ENV == 'test' ? this.configService.get('TEST_QR_CODES_BUCKET_NAME') : this.configService.get('PROD_QR_CODES_BUCKET_NAME')
        this.qrCodeUrl = process.env.ENV == 'test' ? this.configService.get('TEST_QR_CODE_URL') : this.configService.get('PROD_QR_CODE_URL')
    }

    addShop = async (reqBody): Promise<any> => {
        const pointObject: Point = {
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
        }
        const shopData = await this.shopsRepo.save(shopInput)
        // let params = {
        //     Bucket: this.configService.get('QR_CODES_BUCKET_NAME'),
        //     Key: `${shopData.id}.${type}`, // type is not required
        //     Body: base64Data,
        //     ACL: 'public-read',
        //     ContentEncoding: 'base64', // required
        //     ContentType: `image/${type}` // required. Notice the back ticks
        // }
        const qr_url = this.minlUrl+shopData.id
        const qr_code_url = this.qrCodeUrl+shopData.id+'.png'
        let qrResp  = await QRCode.toDataURL(qr_url)
        const base64Data: any = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = qrResp.split(';')[0].split('/')[1];
        let params = {
            Bucket: this.qrCodeBucket,
            Key: `${shopData.id}.${type}`, // type is not required
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64', // required
            ContentType: `image/${type}` // required. Notice the back ticks
        }
        const fileRes: any = await this.utilsService.uploadS3(params)
        const shopUpdate = await this.shopsRepo.update({id: shopData.id}, {qr_url: qr_code_url})
        console.log("shop updating ...")
        console.log(shopUpdate)
        return shopData
    }

    async createQrCodeForShop(reqBody: any): Promise<any> {
        const shopData = await this.shopsRepo.findOneBy({id:reqBody.shop_id})
        const qr_url = this.minlUrl+shopData.id
        const qr_code_url = this.qrCodeUrl+shopData.id+'.png'
        let qrResp  = await QRCode.toDataURL(qr_url)
        const base64Data: any = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = qrResp.split(';')[0].split('/')[1];
        let params = {
            Bucket: this.qrCodeBucket,
            Key: `${shopData.id}.${type}`, // type is not required
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64', // required
            ContentType: `image/${type}` // required. Notice the back ticks
        }
        const fileRes: any = await this.utilsService.uploadS3(params)
        const shopUpdate = await this.shopsRepo.update({id: shopData.id}, {qr_url: qr_code_url})
        return shopUpdate
    }

    async createQrCodeForGeneralBooking(reqBody: any): Promise<any> {
        // const qr_url = 'http://minl.app/booking'
        // const qr_url = 'http://test-minl.goodmove.in/delhi'
        const qr_url = 'https://minl.app/delhi'
        const qr_code_url = this.qrCodeUrl+'delhi_general.png'
        let qrResp  = await QRCode.toDataURL(qr_url)
        const base64Data: any = Buffer.from(qrResp.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = qrResp.split(';')[0].split('/')[1];
        let params = {
            Bucket: this.qrCodeBucket,
            Key: `delhi_general.${type}`, // type is not required
            Body: base64Data,
            ACL: 'public-read',
            ContentEncoding: 'base64', // required
            ContentType: `image/${type}` // required. Notice the back ticks
        }
        const fileRes: any = await this.utilsService.uploadS3(params)
        // const shopUpdate = await this.shopsRepo.update({id: shopData.id}, {qr_url: qr_code_url})
        console.log(fileRes)
        return qr_code_url
    }

    async getShopDetailsById(shop_id: number): Promise<any> {
        const shopData = await this.shopsRepo.findOneBy({id: shop_id})
        return shopData
    }

    async getShops(shop_id: number): Promise<any> {
        const [items, count] = await this.shopsRepo.findAndCount({order: {id: 'DESC'}})
        return {items, count}
    }

    async updateShop(id: number, reqBody: any): Promise<any> {
        delete reqBody.mobile_number;
        const shopData = await this.shopsRepo.update({id: id}, reqBody)
        return shopData;
    }

    async deleteShop(id: number): Promise<any> {
        const shopData = await this.shopsRepo.delete(id)
        return shopData;
    }
    
}
