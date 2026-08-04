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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rxjs_1 = require("rxjs");
const utils_service_1 = require("../../utils/services/utils.service");
const typeorm_2 = require("typeorm");
const customerAddress_entity_1 = require("../models/customerAddress.entity");
const notifications_entity_1 = require("../models/notifications.entity");
const users_entity_1 = require("../models/users.entity");
const specialAddress_entity_1 = require("../models/specialAddress.entity");
const driverLastLocDetails_1 = require("../../trucks/models/driverLastLocDetails");
let UsersService = class UsersService {
    constructor(usersRepository, cAddrRepository, splAddrRepository, notiRepository, driverLastLocRepo, utilsService) {
        this.usersRepository = usersRepository;
        this.cAddrRepository = cAddrRepository;
        this.splAddrRepository = splAddrRepository;
        this.notiRepository = notiRepository;
        this.driverLastLocRepo = driverLastLocRepo;
        this.utilsService = utilsService;
    }
    async getUsers() {
        let users = (0, rxjs_1.from)(this.usersRepository.find());
        return users;
    }
    async sendOtp(mobile) {
        return (0, rxjs_1.from)(this.utilsService.sendOtp(mobile));
    }
    async verifyOtp(mobile, otp) {
        return await this.utilsService.verifyOtp(mobile, otp);
    }
    async checkUser(mobile, userType = '') {
        let qureyObj = [];
        if (userType == 'Driver') {
            qureyObj.push({ mobile: mobile, user_type: 'Driver', status: 'Active' });
            qureyObj.push({ mobile: mobile, user_type: 'Driver', status: 'DarkRoom' });
            qureyObj.push({ mobile: mobile, user_type: 'Owner', status: 'Active' });
        }
        else if (userType) {
            qureyObj.push({ mobile: mobile, user_type: userType, status: 'Active' });
        }
        else {
            qureyObj.push({ mobile: mobile, status: 'Active' });
        }
        let user = await this.usersRepository.findOne({ where: qureyObj });
        return user;
    }
    async updateStatus(mobile, status) {
        let user = await this.usersRepository.update({ mobile }, { "status": status });
        let userData = await this.usersRepository.findOneBy({ mobile: mobile });
        const driver = this.utilsService.isUserWithDriver(userData.id);
        if (driver) {
            const dStatus = status == 'Active' ? false : true;
            this.utilsService.driverDarkroom(userData.id, dStatus);
        }
        return user;
    }
    async updateAvailable(mobile, is_available) {
        const userData = await this.usersRepository.findOneBy({ mobile: mobile });
        if (userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({ mobile }, { "is_available": is_available });
            let TITLE = 'Hello #';
            let BODY = '';
            if (!is_available) {
                BODY = 'Your tours have been completed. Thank you for your co-operation. Have a good day!';
                await this.utilsService.closeSession(userData.id);
                await this.driverLastLocRepo.delete({ driver_id: userData.id });
            }
            else {
                BODY = 'You will be assigned tours shortly. Have a good day!';
            }
            if (userData.device_token) {
                TITLE = TITLE + userData.name;
                const userToken = userData.device_token ? userData.device_token.split(",") : '';
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken);
            }
            return user;
        }
        else {
            return false;
        }
    }
    async updateAvailableById(user_id, is_available) {
        const userData = await this.usersRepository.findOneBy({ id: user_id });
        if (userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({ id: user_id }, { "is_available": is_available });
            let TITLE = 'Hello #';
            let BODY = '';
            if (!is_available) {
                BODY = 'Your tours have been completed. Thank you for your co-operation. Have a good day!';
                await this.utilsService.closeSession(user_id);
                await this.driverLastLocRepo.delete({ driver_id: userData.id });
            }
            else {
                BODY = 'You will be assigned tours shortly. Have a good day!';
            }
            if (userData.device_token) {
                TITLE = TITLE + userData.name;
                const userToken = userData.device_token ? userData.device_token.split(",") : '';
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken);
            }
            return user;
        }
        else {
            return false;
        }
    }
    async addUser(reqBody) {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false
        };
        let user = await this.usersRepository.save(userInput);
        return user;
    }
    async register(reqBody) {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false,
            company_name: reqBody.company_name,
            company_type: reqBody.company_type
        };
        let user = await this.usersRepository.save(userInput);
        return user;
    }
    async profileUpdate(reqBody) {
        let userInput = {};
        if (reqBody.name) {
            userInput['name'] = reqBody.name;
        }
        if (reqBody.company_name) {
            userInput['company_name'] = reqBody.company_name;
        }
        if (reqBody.company_type) {
            userInput['company_type'] = reqBody.company_type;
        }
        let user = await this.usersRepository.update({ mobile: reqBody.mobile_number }, userInput);
        return user;
    }
    async updateOwner(id, reqBody) {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false
        };
        let user = await this.usersRepository.update({ id }, userInput);
        return user;
    }
    async deleteOwner(id) {
        let user = await this.usersRepository.delete(id);
        return user;
    }
    async getUsersByType(reqBody, userType) {
        const [items, count] = await this.usersRepository.findAndCount({ where: { user_type: userType }, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async addAddress(reqBody) {
        const locPoint = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const addrInput = {
            "address": reqBody.address,
            "address_type": reqBody.address_type,
            "city": reqBody.city,
            "country": reqBody.country,
            "customer_id": reqBody.customer_id,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "mobile": reqBody.mobile,
            "pincode": reqBody.pincode,
            "receiver_contact": reqBody.receiver_contact,
            "receiver_name": reqBody.receiver_name,
            "state": reqBody.state,
            "created_by": reqBody.customer_id,
            "is_live": ('is_live' in reqBody) ? reqBody.is_live : false,
            "location": locPoint
        };
        const addrDetails = await this.cAddrRepository.save(addrInput);
        return addrDetails;
    }
    async updateAddress(id, reqBody) {
        const locPoint = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const addrInput = {
            "address": reqBody.address,
            "address_type": reqBody.address_type,
            "city": reqBody.city,
            "country": reqBody.country,
            "customer_id": reqBody.customer_id,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "mobile": reqBody.mobile,
            "pincode": reqBody.pincode,
            "receiver_contact": reqBody.receiver_contact,
            "receiver_name": reqBody.receiver_name,
            "state": reqBody.state,
            "created_by": reqBody.customer_id,
            "location": locPoint
        };
        const addrDetails = await this.cAddrRepository.update({ id }, addrInput);
        return addrDetails;
    }
    async deleteAddress(id) {
        const addData = await this.cAddrRepository.delete(id);
        return addData;
    }
    async deleteAddresses(reqBody) {
        if (reqBody.address_ids) {
            for (let addId of reqBody.address_ids) {
                await this.cAddrRepository.delete({ id: addId });
            }
        }
        return true;
    }
    async getAddress(reqBody) {
        const company = await this.utilsService.companyUsers(reqBody.customer_id);
        let cIds = [];
        if (company) {
            cIds = company.users.split(",");
            cIds.pop();
            cIds = cIds.map((c) => {
                return c.replace('#', '');
            });
        }
        else {
            cIds.push(reqBody.customer_id);
        }
        const pickupAdds = await this.cAddrRepository.find({ where: { customer_id: (0, typeorm_2.In)(cIds), address_type: 'Pickup' }, order: { id: 'DESC' } });
        const dropOffAdds = await this.cAddrRepository.find({ where: { customer_id: (0, typeorm_2.In)(cIds), address_type: 'Drop-off' }, order: { id: 'DESC' } });
        let pAddress = [];
        let pics = pickupAdds.filter((item) => {
            if (pAddress.indexOf(item.address) < 0) {
                pAddress.push(item.address);
                return item;
            }
        });
        let dAddress = [];
        let drops = dropOffAdds.filter((item) => {
            if (dAddress.indexOf(item.address) < 0) {
                dAddress.push(item.address);
                return item;
            }
        });
        return {
            Pickup_address: pics,
            Dropoff_address: drops
        };
    }
    async getCustomerAddress(reqBody) {
        let addresses = [];
        const user = await this.usersRepository.findOneBy({ mobile: reqBody.customer_mobile });
        if (user) {
            addresses = await this.cAddrRepository.find({ where: { customer_id: user.id }, order: { id: 'DESC' } });
        }
        return addresses;
    }
    async getAddressById(reqBody) {
        const pickupAdds = await this.cAddrRepository.findOneBy({ id: reqBody.address_id });
        return pickupAdds;
    }
    async getUserById(user_id) {
        const user = await this.usersRepository.findOneBy({ id: user_id });
        return user;
    }
    async getAllCustomers(reqBody) {
        const customers = [];
        const [items, count] = await this.usersRepository.findAndCount({ where: { user_type: 'Customer' }, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        for (let customer of items) {
            let customerData = Object.assign(Object.assign({}, customer), { company: await this.utilsService.companyUsers(customer.id) });
            customers.push(customerData);
        }
        return { items: customers, count };
    }
    async getRegularCustomers(reqBody) {
        let customers = [];
        let companies = await this.utilsService.getAllCompanies(reqBody);
        for (let company of companies) {
            let cIds = company.users.split(",");
            cIds.pop();
            cIds = cIds.map((c) => {
                return c.replace('#', '');
            });
            const [items, count] = await this.usersRepository.findAndCount({ where: { user_type: 'Customer', id: (0, typeorm_2.In)(cIds) }, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
            for (let customer of items) {
                let customerData = Object.assign(Object.assign({}, customer), { company: company });
                customers.push(customerData);
            }
        }
        return { items: customers };
    }
    async updateDeviceToken(reqBody) {
        let userData = await this.usersRepository.findOneBy({ id: reqBody.userId });
        let previousTokens = userData.device_token ? userData.device_token.split(",") : [];
        let user = {};
        if (previousTokens.indexOf(reqBody.token) > -1) {
            let device_token = userData.device_token;
            user = await this.usersRepository.update({ id: reqBody.userId }, { "device_token": device_token });
        }
        else {
            let device_token = userData.device_token + (userData.device_token ? "," : "") + reqBody.token;
            user = await this.usersRepository.update({ id: reqBody.userId }, { "device_token": device_token });
        }
        return user;
    }
    async getNotifications(reqBody) {
        const [items, count] = await this.notiRepository.findAndCount({ where: { status: 0 }, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async viewNotification(reqBody) {
        const noti = await this.notiRepository.update({ id: reqBody.id }, { status: 0, viewed_by: reqBody.user_id, viewed_at: new Date() });
        return noti;
    }
    async getAllCompanies(reqBody) {
        return await this.utilsService.getAllCompanies(reqBody);
    }
    async tagCutomerToCompany(reqBody) {
        return await this.utilsService.tagCutomerToCompany(reqBody);
    }
    async getUnassignedCustomers(reqBody) {
        return await this.utilsService.getUnassignedCustomers();
    }
    async addCustomerCompany(reqBody) {
        return await this.utilsService.addCustomerCompany(reqBody);
    }
    async getCustomersByIds(reqBody) {
        return await this.usersRepository.find({ where: { id: (0, typeorm_2.In)(reqBody.customerIds) } });
    }
    async sendNotificationToAll(reqBody) {
        const TITLE = 'Version Update.';
        const BODY = `Hello! We wanted to let you know that we've just released a new update for our app. This update includes some great new features and improvements, so we highly recommend you update to the latest version as soon as possible. Thanks, and we hope you enjoy the new update!`;
        let users = await this.usersRepository.find({ where: { mobile: '9382066611' } });
        for (let user of users) {
            if (user.device_token) {
                console.log(user.name, user.id, user.device_token);
                await this.utilsService.sendPushNotification(TITLE, BODY, user.device_token.split(","));
            }
        }
        return true;
    }
    async addSpecialAddress(reqBody) {
        const locPoint = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        const addrInput = {
            "address": reqBody.address,
            "city": reqBody.city,
            "country": reqBody.country,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "pincode": reqBody.pincode,
            "location": locPoint
        };
        const addrDetails = await this.splAddrRepository.save(addrInput);
        return addrDetails;
    }
    async euclideanDistance(lat1, long1, lat2, long2) {
        const earthRadius = 6371;
        const pi = 3.14;
        const p1Lat = (lat1 / 180) * pi;
        const p1Long = (long1 / 180) * pi;
        const p2Lat = (lat2 / 180) * pi;
        const p2Long = (long2 / 180) * pi;
        const x1 = earthRadius * Math.cos(p1Lat) * Math.cos(p1Long);
        const x2 = earthRadius * Math.cos(p2Lat) * Math.cos(p2Long);
        const y1 = earthRadius * Math.cos(p1Lat) * Math.sin(p1Long);
        const y2 = earthRadius * Math.cos(p2Lat) * Math.sin(p2Long);
        const z1 = earthRadius * Math.sin(p1Lat);
        const z2 = earthRadius * Math.sin(p2Lat);
        const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
        return Math.floor(distance * 1000);
    }
    ;
    async checkLiveAddress(reqBody) {
        let liveAddressResp = "";
        if (!reqBody.customer_id || reqBody.customer_id === undefined) {
            return false;
        }
        const company = await this.utilsService.companyUsers(reqBody.customer_id);
        let cIds = [];
        if (company) {
            cIds = company.users.split(",");
            cIds.pop();
            cIds = cIds.map((c) => {
                return c.replace('#', '');
            });
        }
        else {
            cIds.push(reqBody.customer_id);
        }
        const liveAddresses = await this.cAddrRepository.find({ where: { customer_id: (0, typeorm_2.In)(cIds), is_live: true }, order: { id: 'DESC' } });
        for (let liveAddress of liveAddresses) {
            let dis = await this.euclideanDistance(reqBody.latitude, reqBody.longitude, liveAddress.latitude, liveAddress.longitude);
            if (dis <= 50) {
                liveAddressResp = liveAddress;
            }
        }
        return liveAddressResp;
    }
};
UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(customerAddress_entity_1.CustomerAddressEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(specialAddress_entity_1.SpecialAddressEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(notifications_entity_1.NotificationsEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(driverLastLocDetails_1.DriverLastLocationDetails)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        utils_service_1.UtilsService])
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map