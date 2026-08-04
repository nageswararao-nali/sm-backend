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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const categories_entity_1 = require("../../utils/models/categories.entity");
const typeorm_2 = require("typeorm");
const consolidationCenters_entity_1 = require("../models/consolidationCenters.entity");
const admin = require("firebase-admin");
const expo_server_sdk_1 = require("expo-server-sdk");
const node_1 = require("read-excel-file/node");
const pdf = require("html-pdf");
const fs = require("fs");
const nodemailer = require("nodemailer");
const users_entity_1 = require("../../users/models/users.entity");
const baseLocations_entity_1 = require("../models/baseLocations.entity");
const portalSettings_entity_1 = require("../models/portalSettings.entity");
const ioredis_1 = require("ioredis");
const redis_provider_1 = require("../../common/redis/redis.provider");
const PAUSE_AUTO_ALLOCATION_SETTING = 'pause_auto_allocation';
const PAUSE_AUTO_ALLOCATION_REDIS_KEY = 'autoAlloc:paused';
const firebaseCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './goodmove-firebase.json';
const fbCredentials = fs.existsSync(firebaseCredentialsPath)
    ? JSON.parse(fs.readFileSync(firebaseCredentialsPath, 'utf8'))
    : null;
let expo = new expo_server_sdk_1.Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
let AdminService = class AdminService {
    constructor(ccRepo, catRepo, usersRepo, baseLocationsRepo, portalSettingsRepo, redis) {
        this.ccRepo = ccRepo;
        this.catRepo = catRepo;
        this.usersRepo = usersRepo;
        this.baseLocationsRepo = baseLocationsRepo;
        this.portalSettingsRepo = portalSettingsRepo;
        this.redis = redis;
        if (!admin.apps.length && fbCredentials) {
            admin.initializeApp({
                credential: admin.credential.cert(fbCredentials)
            });
        }
    }
    async addConsolidationCenter(reqBody) {
        const pointObject = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const ccInput = {
            "unique_id": reqBody.unique_id,
            "address": reqBody.address,
            "city": reqBody.city,
            "state": reqBody.state,
            "country": reqBody.country,
            "zip_code": reqBody.zip_code,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "location": pointObject
        };
        const driverData = await this.ccRepo.save(ccInput);
        return driverData;
    }
    async getConsolidationCenters(reqBody) {
        const [items, count] = await this.ccRepo.findAndCount({ order: { id: 'ASC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async addBaseLocation(reqBody) {
        const pointObject = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const bLoc = await this.baseLocationsRepo.findOne({ where: { unique_id: reqBody.unique_id } });
        if (!bLoc) {
            const ccInput = {
                "unique_id": reqBody.unique_id,
                "address": reqBody.address,
                "city": reqBody.city,
                "state": reqBody.state,
                "country": reqBody.country,
                "zip_code": reqBody.zip_code,
                "latitude": reqBody.latitude,
                "longitude": reqBody.longitude,
                "location": pointObject
            };
            const baseLocationData = await this.baseLocationsRepo.save(ccInput);
            return baseLocationData;
        }
        else {
            return { message: 'Driver already have Base Location' };
        }
    }
    async getBaseLocations(reqBody) {
        const [items, count] = await this.baseLocationsRepo.findAndCount({ order: { id: 'ASC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async editBaseLocation(reqBody) {
        const pointObject = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const baseLocationData = await this.baseLocationsRepo.update({ id: reqBody.id }, { location: pointObject });
        return baseLocationData;
    }
    async getPortalSettings(reqBody) {
        const [items, count] = await this.portalSettingsRepo.findAndCount({ order: { id: 'ASC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 100) });
        return { items, count };
    }
    async addPortalSetting(reqBody) {
        const existing = await this.portalSettingsRepo.findOne({ where: { setting_name: reqBody.setting_name } });
        if (existing) {
            return { message: 'A setting with this name already exists' };
        }
        const settingInput = {
            setting_name: reqBody.setting_name,
            setting_value: !!reqBody.setting_value,
            created_by: reqBody.created_by
        };
        const settingData = await this.portalSettingsRepo.save(settingInput);
        await this.syncPortalSettingRedis(settingData.setting_name, settingData.setting_value);
        return settingData;
    }
    async editPortalSetting(reqBody) {
        const setting = await this.portalSettingsRepo.findOneBy({ id: reqBody.id });
        const settingValue = !!reqBody.setting_value;
        const settingData = await this.portalSettingsRepo.update({ id: reqBody.id }, {
            setting_value: settingValue,
            updated_by: reqBody.updated_by
        });
        if (setting) {
            await this.syncPortalSettingRedis(setting.setting_name, settingValue);
        }
        return settingData;
    }
    async bookDemo(reqBody) {
        const mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'admin@goodmove.in',
            subject: 'New Book a Demo request',
            text: `New demo request from the website:

Name: ${reqBody.name}
Mobile: ${reqBody.mobile}
Email: ${reqBody.email}
Additional Info: ${reqBody.additionalInfo || '-'}`,
        };
        return new Promise((resolve) => {
            mail.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    resolve(false);
                }
                else {
                    console.log('Email sent: ' + info.response);
                    resolve(true);
                }
            });
        });
    }
    async syncPortalSettingRedis(settingName, settingValue) {
        if (settingName === PAUSE_AUTO_ALLOCATION_SETTING) {
            await this.redis.set(PAUSE_AUTO_ALLOCATION_REDIS_KEY, settingValue ? '1' : '0');
            console.log(`[portalSettings] synced Redis key=${PAUSE_AUTO_ALLOCATION_REDIS_KEY} value=${settingValue}`);
        }
    }
    async getNearestCC(loc) {
        let origin = {
            type: "Point",
            coordinates: [loc.long, loc.lat]
        };
        let locations = await this.ccRepo
            .createQueryBuilder('consolidation_centers')
            .select(['*', 'ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .orderBy("distance", "ASC")
            .setParameters({
            origin: JSON.stringify(origin)
        })
            .getRawMany();
        return locations[0];
    }
    async getDistanceToCC(loc) {
        let origin = {
            type: "Point",
            coordinates: [loc.long, loc.lat]
        };
        let locations = await this.ccRepo
            .createQueryBuilder('consolidation_centers')
            .select(['*', 'ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("id = :id", { id: loc.ccId })
            .orderBy("distance", "ASC")
            .setParameters({
            origin: JSON.stringify(origin)
        })
            .getRawOne();
        return locations;
    }
    async getDriverNearestBaseLocation(loc) {
        let origin = {
            type: "Point",
            coordinates: [loc.long, loc.lat]
        };
        let locations = await this.baseLocationsRepo
            .createQueryBuilder('base_locations')
            .select(['*', 'ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("unique_id = :id", { id: loc.driver_id })
            .orderBy("distance", "ASC")
            .setParameters({
            origin: JSON.stringify(origin)
        })
            .getRawMany();
        return locations[0];
    }
    async getMainNearestBaseLocation(loc) {
        let origin = {
            type: "Point",
            coordinates: [loc.long, loc.lat]
        };
        let locations = await this.baseLocationsRepo
            .createQueryBuilder('base_locations')
            .select(['*', 'ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("is_main_base = :id", { id: true })
            .orderBy("distance", "ASC")
            .setParameters({
            origin: JSON.stringify(origin)
        })
            .getRawMany();
        return locations[0];
    }
    async getCategories(reqBody) {
        const packagingTypes = await this.catRepo.find({ where: { cate_type: 'packaging_type' } });
        const volumeTypes = await this.catRepo.find({ where: { cate_type: 'volume_unit' } });
        const lengthTypes = await this.catRepo.find({ where: { cate_type: 'length_unit' } });
        const heightTypes = await this.catRepo.find({ where: { cate_type: 'height_unit' } });
        const dimentionTypes = await this.catRepo.find({ where: { cate_type: 'dimension_unit' } });
        const breadthTypes = await this.catRepo.find({ where: { cate_type: 'breadth_unit' } });
        const weightTypes = await this.catRepo.find({ where: { cate_type: 'weight_unit' } });
        const commodityTypes = await this.catRepo.find({ where: { cate_type: 'commodity_type' } });
        return {
            "packaging_types": packagingTypes,
            'volume_unit_types': volumeTypes,
            'length_unit_types': lengthTypes,
            'height_unit_types': heightTypes,
            'breadth_unit_types': breadthTypes,
            'weight_unit_types': weightTypes,
            'commodity_type_types': commodityTypes,
            'dimension_unit_types': dimentionTypes
        };
    }
    async sendNotification(reqBody) {
        const payload = {
            notification: {
                title: "test",
                body: "test body"
            }
        };
        return await admin.messaging().sendToDevice(reqBody.token, payload);
    }
    async sendPushNotification(title, body, savedPushTokens) {
        let notifications = [];
        for (let pushToken of savedPushTokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                continue;
            }
            notifications.push({
                to: pushToken,
                sound: "default",
                title: title,
                body: body,
                data: { body }
            });
        }
        let chunks = expo.chunkPushNotifications(notifications);
        (async () => {
            for (let chunk of chunks) {
                try {
                    let receipts = await expo.sendPushNotificationsAsync(chunk);
                    console.log(receipts);
                    return receipts;
                }
                catch (error) {
                    console.error(error);
                    return null;
                }
            }
        })();
        return;
    }
    ;
    async sendSingleInvoice(filePath) {
        const schema = {
            'Invoice No.': {
                prop: 'invoiceNo'
            },
            'Invoice Date': {
                prop: 'invoiceDate',
                type: (value) => {
                    return new Date(value).toLocaleDateString("en-US");
                }
            },
            'Name of the company': {
                prop: 'company'
            },
            'From': {
                prop: 'from'
            },
            'To': {
                prop: 'to'
            },
            'Freight charges based on load and distance': {
                prop: 'freightCharges'
            },
            'Waiting charges': {
                prop: 'waitingCharges'
            },
            'Discount': {
                prop: 'discount'
            },
            'Total charges': {
                prop: 'totalCharges'
            },
            'SGST': {
                prop: 'sgst'
            },
            'CGST': {
                prop: 'cgst'
            },
            'Tax Amount Payable': {
                prop: 'tax'
            },
            'Address of the company': {
                prop: 'companyAddress'
            },
            'Name of the customer': {
                prop: 'customerName'
            },
            'Mobile no': {
                prop: 'mobile'
            },
            'email id': {
                prop: 'email'
            },
            'GST No.': {
                prop: 'gstNo'
            },
            'tatt': {
                prop: 'tatt'
            },
            'tpa': {
                prop: 'tpa'
            }
        };
        const pdfOptions = {
            childProcessOptions: {
                env: {
                    OPENSSL_CONF: '/dev/null',
                },
            }
        };
        let data = await (0, node_1.default)(filePath, { schema });
        for (let row of data.rows) {
            var template = './public/invoice.html';
            var pdf_path = './public/inv3.pdf';
            var html = fs.readFileSync(template, 'utf8');
            for (let key in schema) {
                if (key == 'email id') {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop].split(",")[0]);
                }
                else {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop]);
                }
            }
            pdf.create(html, pdfOptions).toFile(pdf_path, function (err, res1) {
                if (err)
                    return console.log(err);
                fs.existsSync(res1.filename);
                var mailOptions = {
                    from: 'noreplygo.20221@gmail.com',
                    to: row["email"] + ', admin@gogoodmove.com',
                    subject: 'G-O (Invoice No:' + row["invoiceNo"] + '): Thank you for shipping with us!',
                    text: `Greetings from G-O!!!

Please find attached the invoice.
                
We deliver your goods safely while you focus on your core business!`,
                    attachments: [
                        {
                            filename: row["invoiceNo"] + '.pdf',
                            path: pdf_path
                        }
                    ]
                };
                mail.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                        fs.unlinkSync(pdf_path);
                    }
                });
            });
        }
        await fs.unlinkSync(filePath);
        return true;
    }
    async sendBulkInvoice(filePath) {
        const schema = {
            'Invoice No.': {
                prop: 'invoiceNo'
            },
            'Invoice Date': {
                prop: 'invoiceDate',
                type: (value) => {
                    return new Date(value).toLocaleDateString("en-US");
                }
            },
            'Name of the company': {
                prop: 'company'
            },
            'Booking date': {
                prop: 'bookingDate'
            },
            'Total bookings': {
                prop: 'totalBookings'
            },
            'Freight charges based on load and distance': {
                prop: 'freightCharges'
            },
            'Waiting charges': {
                prop: 'waitingCharges'
            },
            'Discount': {
                prop: 'discount'
            },
            'Total charges': {
                prop: 'totalCharges'
            },
            'SGST': {
                prop: 'sgst'
            },
            'CGST': {
                prop: 'cgst'
            },
            'Tax Amount Payable': {
                prop: 'tax'
            },
            'Address of the company': {
                prop: 'companyAddress'
            },
            'Name of the customer': {
                prop: 'customerName'
            },
            'Mobile no': {
                prop: 'mobile'
            },
            'email id': {
                prop: 'email'
            },
            'GST No.': {
                prop: 'gstNo'
            },
            'tatt': {
                prop: 'tatt'
            },
            'tpa': {
                prop: 'tpa'
            }
        };
        const pdfOptions = {
            childProcessOptions: {
                env: {
                    OPENSSL_CONF: '/dev/null',
                },
            }
        };
        let data = await (0, node_1.default)(filePath, { schema });
        data.rows.map((row) => {
            var template = './public/bulkinvoice.html';
            var pdf_path = './public/' + row["invoiceNo"] + '.pdf';
            var html = fs.readFileSync(template, 'utf8');
            for (let key in schema) {
                if (key == 'email id') {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop].split(",")[0]);
                }
                else {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop]);
                }
            }
            pdf.create(html, pdfOptions).toFile(pdf_path, function (err, res1) {
                if (err)
                    return console.log(err);
                console.log(res1);
                fs.existsSync(res1.filename);
                var mailOptions = {
                    from: 'noreplygo.20221@gmail.com',
                    to: row["email"] + ', admin@gogoodmove.com',
                    subject: 'G-O (Invoice No:' + row["invoiceNo"] + '): Thank you for shipping with us!',
                    text: `Greetings from G-O!!!

Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                    attachments: [
                        {
                            filename: row["invoiceNo"] + '.pdf',
                            path: pdf_path
                        }
                    ]
                };
                mail.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                        fs.unlinkSync(pdf_path);
                    }
                });
            });
        });
        await fs.unlinkSync(filePath);
        return true;
    }
    async sendFlipkartBulkInvoice(filePath) {
        const schema = {
            'Invoice No.': {
                prop: 'invoiceNo'
            },
            'Invoice Date': {
                prop: 'invoiceDate',
                type: (value) => {
                    return new Date(value).toLocaleDateString("en-US");
                }
            },
            'Name of the company': {
                prop: 'company'
            },
            'Booking date': {
                prop: 'bookingDate'
            },
            'Total bookings': {
                prop: 'totalBookings'
            },
            'Freight charges based on load and distance': {
                prop: 'freightCharges'
            },
            'Waiting charges': {
                prop: 'waitingCharges'
            },
            'Discount': {
                prop: 'discount'
            },
            'Total charges': {
                prop: 'totalCharges'
            },
            'SGST': {
                prop: 'sgst'
            },
            'CGST': {
                prop: 'cgst'
            },
            'Tax Amount Payable': {
                prop: 'tax'
            },
            'Address of the company': {
                prop: 'companyAddress'
            },
            'Name of the customer': {
                prop: 'customerName'
            },
            'Mobile no': {
                prop: 'mobile'
            },
            'email id': {
                prop: 'email'
            },
            'GST No.': {
                prop: 'gstNo'
            }
        };
        const pdfOptions = {
            childProcessOptions: {
                env: {
                    OPENSSL_CONF: '/dev/null',
                },
            }
        };
        let data = await (0, node_1.default)(filePath, { schema });
        data.rows.map((row) => {
            console.log(row);
            let totalFreightCharges = row['totalCharges'] + row['tax'];
            var template = './public/bulkinvoice.html';
            var pdf_path = './public/' + row["invoiceNo"] + '.pdf';
            var html = fs.readFileSync(template, 'utf8');
            for (let key in schema) {
                if (key == 'email id') {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop].split(",")[0]);
                }
                else {
                    html = html.replace('{{' + key + "}}", row[schema[key].prop]);
                }
            }
            html = html.replace('{{Final-Total-Charges}}', totalFreightCharges);
            pdf.create(html, pdfOptions).toFile(pdf_path, function (err, res1) {
                if (err)
                    return console.log(err);
                console.log(res1);
                fs.existsSync(res1.filename);
                var mailOptions = {
                    from: 'noreplygo.20221@gmail.com',
                    to: row["email"] + ', admin@gogoodmove.com',
                    subject: 'G-O (Invoice No:' + row["invoiceNo"] + '): Thank you for shipping with us!',
                    text: `Greetings from G-O!!!

Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                    attachments: [
                        {
                            filename: row["invoiceNo"] + '.pdf',
                            path: pdf_path
                        }
                    ]
                };
            });
        });
        await fs.unlinkSync(filePath);
        return true;
    }
    async sendCustomerNotifications() {
        const allCustomers = await this.usersRepo.find({ where: { user_type: 'Customer', device_token: (0, typeorm_2.Not)('') } });
        for (let customer of allCustomers) {
            const title = "Hey " + customer.name + ",";
            const body = "Looking for a partner to deliver your goods? Start shipping with GoodMove. Your safe, reliable and affordable city logistics partner.";
            await this.sendPushNotification(title, body, customer.device_token.split(","));
        }
        return true;
    }
    async sendNotificationToUsers(reqBody) {
        const allCustomers = await this.usersRepo.find({ where: { id: (0, typeorm_2.In)(reqBody.users), device_token: (0, typeorm_2.Not)('') } });
        for (let customer of allCustomers) {
            const title = "Hey " + customer.name + ",";
            const body = "Looking for a partner to deliver your goods? Start shipping with GoodMove. Your safe, reliable and affordable city logistics partner.";
            await this.sendPushNotification(title, body, customer.device_token.split(","));
        }
        return true;
    }
    async sendNotificationToAll(reqBody) {
        const allCustomers = await this.usersRepo.find({ where: { device_token: (0, typeorm_2.Not)('') } });
        for (let customer of allCustomers) {
            const title = "பொங்கல் வாழ்த்துக்கள்";
            const body = `இன்பம் பொங்கி வழியட்டும்
        இல்லங்களிலும் உள்ளங்களிலும்
        இனிய தைதிருநாள் நல்வாழ்த்துகள்`;
            await this.sendPushNotification(title, body, customer.device_token.split(","));
        }
        return true;
    }
};
AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(consolidationCenters_entity_1.ConsolidationCenterEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(categories_entity_1.CategoriesEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(baseLocations_entity_1.BaseLocationsEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(portalSettings_entity_1.PortalSettingsEntity)),
    __param(5, (0, common_1.Inject)(redis_provider_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ioredis_1.Redis])
], AdminService);
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map