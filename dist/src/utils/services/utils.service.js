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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilsService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const rxjs_1 = require("rxjs");
const tourRoute_entity_1 = require("../../tours/models/tourRoute.entity");
const driver_entity_1 = require("../../trucks/models/driver.entity");
const users_entity_1 = require("../../users/models/users.entity");
const typeorm_2 = require("typeorm");
const categories_entity_1 = require("../models/categories.entity");
const expo_server_sdk_1 = require("expo-server-sdk");
const driverSessions_entity_1 = require("../../trucks/models/driverSessions.entity");
const aws_sdk_1 = require("aws-sdk");
const cusomerCompanyDetails_1 = require("../../trucks/models/cusomerCompanyDetails");
const operators_1 = require("rxjs/operators");
const moment = require("moment");
const baseLocations_entity_1 = require("../../admin/models/baseLocations.entity");
const driverSessionDistance_entity_1 = require("../../trucks/models/driverSessionDistance.entity");
let expo = new expo_server_sdk_1.Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
let UtilsService = class UtilsService {
    constructor(httpService, configService, usersRepository, categoriesRepository, driversRepository, dsRepository, tourRouteRepository, companyRepo, baseLocationsRepo, dataSource, driverSessionDistance) {
        this.httpService = httpService;
        this.configService = configService;
        this.usersRepository = usersRepository;
        this.categoriesRepository = categoriesRepository;
        this.driversRepository = driversRepository;
        this.dsRepository = dsRepository;
        this.tourRouteRepository = tourRouteRepository;
        this.companyRepo = companyRepo;
        this.baseLocationsRepo = baseLocationsRepo;
        this.dataSource = dataSource;
        this.driverSessionDistance = driverSessionDistance;
    }
    async sendOtp(mobile) {
        const otp_url = "https://api.msg91.com/api/v5/otp?authkey=" + this.configService.get('MMSG91_AUTHKEY') + "&template_id=" + this.configService.get('MSG91_SEND_OTP_TEMPLATE_ID') + "&DLT_TE_ID=" + this.configService.get('MSG91_SEND_OTP_DLT_ID') + "&otp_length=" + this.configService.get('OTP_LENGTH') + "&mobile=+91" + mobile;
        console.log(otp_url);
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url, {
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        }));
        console.log(res);
        console.log(res.data);
        return res.data;
    }
    async verifyOtp(mobile, otp) {
        const verify_otp_url = "https://api.msg91.com/api/v5/otp/verify?mobile=+91" + mobile + "&otp=" + otp + "&authkey=" + this.configService.get('MMSG91_AUTHKEY');
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(verify_otp_url, {
            headers: { "Accept-Encoding": "gzip,deflate,compress" }
        }));
        return res.data;
    }
    async sendBookingSMS(data) {
        const url = this.configService.get('MSG_SEND_SMS_URL');
        const options = {
            headers: {
                'authkey': this.configService.get('MMSG91_AUTHKEY'),
                'Content-Type': 'application/json'
            }
        };
        const respData = await (0, rxjs_1.lastValueFrom)(this.httpService.post(url, data, options).pipe((0, operators_1.map)(resp => resp.data)));
        return respData;
    }
    async getUserById(user_id) {
        const user = await this.usersRepository.findOneBy({ id: user_id });
        return user;
    }
    async getName(cust_id) {
        const user = await this.usersRepository.findOneBy({ id: cust_id });
        return user ? user.name : '';
    }
    async getCatName(cat_id) {
        const category = await this.categoriesRepository.findOneBy({ id: cat_id });
        return category ? category.cate_name : '';
    }
    async getDeviceToken(cust_id) {
        const user = await this.usersRepository.findOneBy({ id: cust_id });
        return user ? user.device_token : '';
    }
    async getBookingId(bookingId) {
        if (typeof bookingId === 'number') {
            return '#' + bookingId;
        }
        else {
            return '#C' + bookingId;
        }
    }
    async getDriverName(driver_id) {
        const driver = await this.driversRepository.findOneBy({ id: driver_id });
        return driver ? driver.name : '';
    }
    async driverDarkroom(driver_id, status) {
        const driver = await this.driversRepository.update({ user_id: driver_id }, { is_darkroom: status });
        return driver;
    }
    async isUserWithDriver(driver_id) {
        const driver = await this.driversRepository.findOneBy({ user_id: driver_id });
        return driver;
    }
    async getCCManagerByccId(cc_id) {
        const ccManager = await this.usersRepository.findOneBy({ cc_id, status: 'Active' });
        return ccManager ? ccManager.id : null;
    }
    async getDistance(from, to) {
        const otp_url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + from.lat + "," + from.long + "&destinations=" + to.lat + "," + to.long + "&key=" + process.env.GOOGLE_MAPS_API_KEY;
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getMinDistance(from, to) {
        const otp_url = "https://maps.googleapis.com/maps/api/directions/json?destination=" + to.lat + "," + to.long + "&origin=" + from.lat + "," + from.long + "&key=" + process.env.GOOGLE_MAPS_API_KEY + "&alternatives=true";
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getDistanceFromOSM(from, to) {
        const otp_url = "http://router.project-osrm.org/route/v1/driving/" + from.long + "," + from.lat + ";" + to.long + "," + to.lat + "?overview=false";
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getDistanceFromGOOSM(from, to) {
        const otp_url = "https://osrm.goodmove.in/route/v1/driving/" + from.long + "," + from.lat + ";" + to.long + "," + to.lat + "?overview=false";
        console.log(otp_url);
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getDistanceFromGOOSMMatch(from, to, p1T, p2T) {
        const otp_url = "http://3.110.41.208:5000/match/v1/driving/" + from.long + "," + from.lat + ";" + to.long + "," + to.lat + "?steps=true&overview=full" + "&timestamps=" + p1T + ";" + p2T + "&radiuses=50;50";
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getWaypointsFromGOOSRM(from, to) {
        const otp_url = "https://osrm.goodmove.in/route/v1/driving/" + from.long + "," + from.lat + ";" + to.long + "," + to.lat + "?geometries=geojson";
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
        return res.data;
    }
    async getWaypointsWithTimeFromGOOSRM(from, to) {
        const url = "https://osrm.goodmove.in/route/v1/driving/" + from.long + "," + from.lat + ";" + to.long + "," + to.lat + "?overview=full&steps=true&geometries=polyline6";
        console.log(url);
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(url));
        return res.data;
    }
    async getGoogleSnappedPoints(pnts) {
        const map_url = "https://roads.googleapis.com/v1/snapToRoads?path=" + pnts + "&interpolate=true&key=" + process.env.GOOGLE_MAPS_API_KEY;
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(map_url));
        return res.data;
    }
    async getGoogleAddressByLatLong(pnt) {
        const map_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + pnt.lat + "," + pnt.long + "&key=" + process.env.GOOGLE_MAPS_API_KEY;
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(map_url));
        return res.data;
    }
    async getGoogleAddressByPlaceId(placeId) {
        const map_url = "https://maps.googleapis.com/maps/api/geocode/json?place_id=" + placeId + "&key=" + process.env.GOOGLE_MAPS_API_KEY;
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(map_url));
        return res.data;
    }
    async getTimeFromGoogle(from, to) {
        const map_url = "https://maps.googleapis.com/maps/api/distancematrix/json?destinations=" + to.latitude + "%2C" + to.longitude + "&origins=" + from.latitude + "%2C" + from.longitude + "&key=" + process.env.GOOGLE_MAPS_API_KEY;
        console.log(map_url);
        let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(map_url));
        return res.data;
    }
    async getTollCharges(from, to) {
        const headersRequest = {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo',
        };
        const reqObj = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": from.lat,
                        "longitude": from.long
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": to.lat,
                        "longitude": to.long
                    }
                }
            },
            "travelMode": "DRIVE",
            "extraComputations": ["TOLLS"],
            "routeModifiers": {
                "vehicleInfo": {
                    "emissionType": "GASOLINE"
                },
                "tollPasses": [
                    "IN_FASTAG",
                    "IN_LOCAL_HP_PLATE_EXEMPT"
                ]
            }
        };
        console.log(reqObj);
        const res = await (0, rxjs_1.lastValueFrom)(this.httpService.post('https://routes.googleapis.com/directions/v2:computeRoutes', reqObj, { headers: headersRequest }));
        console.log(res.data);
        return res.data;
    }
    async getDistanceFromGOOSMMapMatch(points, radius) {
        let i = 0;
        let pointsstr = '';
        let timestamps = '';
        let radiuses = '';
        for (let point of points) {
            if (i == 0) {
                pointsstr = pointsstr + point.longitude + "," + point.latitude;
                timestamps = timestamps + point.timestamp;
                radiuses = radiuses + radius;
            }
            else {
                pointsstr = pointsstr + ";" + point.longitude + "," + point.latitude;
                timestamps = timestamps + ";" + point.timestamp;
                radiuses = radiuses + ";" + radius;
            }
            i++;
        }
        const otp_url = "http://3.110.41.208:5000/match/v1/driving/" + pointsstr + "?steps=true&overview=full&radiuses=" + radiuses + "&timestamps=" + timestamps;
        try {
            let res = await (0, rxjs_1.lastValueFrom)(this.httpService.get(otp_url));
            return res.data;
        }
        catch (e) {
            console.log(otp_url);
            return { code: 'NotOK' };
        }
    }
    async getTourPickupDistance(loc, sId) {
        let origin = {
            type: "Point",
            coordinates: [loc.long, loc.lat]
        };
        let locations = await this.tourRouteRepository
            .createQueryBuilder('tour_route')
            .select(['*', 'ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("id = :id", { id: sId })
            .orderBy("distance", "ASC")
            .setParameters({
            origin: JSON.stringify(origin)
        })
            .getRawOne();
        return locations;
    }
    async updateSeq(id, reqBody) {
        delete reqBody.mobile_number;
        const driverData = await this.tourRouteRepository.update(id, reqBody);
        return driverData;
    }
    async getSeq(id) {
        const seqData = await this.tourRouteRepository.findOneBy({ id });
        return seqData;
    }
    async sendPushNotification(title, body, savedPushTokens, data = {}, silent = false) {
        let notifications = [];
        for (let pushToken of savedPushTokens) {
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                continue;
            }
            const notification = silent
                ? { to: pushToken, priority: 'high', data: Object.assign({ body }, data) }
                : { to: pushToken, sound: "default", title, body, data: Object.assign({ body }, data) };
            notifications.push(notification);
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
    async closeSession(user_id, from_manager = false) {
        let sessionData = await this.dsRepository.findOne({ where: { user_id: user_id, status: true }, order: { id: 'DESC' } });
        console.log("sessionData");
        console.log(sessionData);
        if (sessionData) {
            let updData = {
                status: false
            };
            if (!from_manager) {
                updData["session_end_time"] = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            }
            await this.dsRepository.update({ id: sessionData.id }, updData);
            await this.dsRepository.update({ user_id: user_id }, { status: false });
            let distance = 0;
            sessionData = await this.dsRepository.findOneBy({ id: sessionData.id });
            let [items] = await this.driverSessionDistance.findAndCount({ where: { session_id: sessionData.id } });
            for (let item of items) {
                distance = distance + parseFloat(item.distance);
            }
            let start_time = moment(sessionData.session_start_time);
            let end_time = moment(sessionData.session_end_time);
            let duration_time = moment.duration(end_time.diff(start_time));
            let hours = duration_time.asHours();
            distance = Math.ceil(distance);
            hours = hours.toFixed(2);
            console.log(distance, hours);
            await this.dsRepository.update({ id: sessionData.id }, { total_distance: distance.toString(), total_time: hours });
            console.log("step 2a");
        }
        return sessionData;
    }
    async uploadS3(params) {
        const s3 = this.getS3();
        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    reject(err.message);
                }
                resolve(data);
            });
        });
    }
    getS3() {
        return new aws_sdk_1.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')
        });
    }
    async getAllCustomers() {
        const users = await this.usersRepository.find({ where: { user_type: 'Customer' } });
        return users;
    }
    async getUserDetails(user_id) {
        const user = await this.usersRepository.findOneBy({ id: user_id });
        return user;
    }
    async companyUsers(user_id) {
        let company = await this.companyRepo.findOne({ where: { users: (0, typeorm_2.Like)(`%#${user_id},%`) } });
        return company;
    }
    async getAllCompanies(reqBody) {
        let whereCon = {};
        if ("is_active" in reqBody) {
            whereCon["is_active"] = reqBody.is_active;
        }
        if (reqBody.bCycle) {
            whereCon["billing_cycle"] = reqBody.bCycle;
        }
        if (reqBody.is_regular) {
            whereCon["is_regular"] = true;
        }
        let companies = await this.companyRepo.find({ where: whereCon, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return companies;
    }
    async tagCutomerToCompany(reqBody) {
        let user_id = reqBody.user_id;
        let company_id = reqBody.company_id;
        let usercompany = await this.companyRepo.findOne({ where: { users: (0, typeorm_2.Like)(`%#${user_id},%`) } });
        if (usercompany) {
            let userCompanyUsers = usercompany.users.split(',');
            let index = userCompanyUsers.indexOf('#' + user_id.toString());
            userCompanyUsers.splice(index, 1);
            let usersd = userCompanyUsers.join(',');
            await this.companyRepo.update({ id: usercompany.id }, { users: usersd });
        }
        let company = await this.companyRepo.findOneBy({ id: company_id });
        let users = company.users + '#' + user_id + ",";
        await this.companyRepo.update({ id: company_id }, { users: users });
        return company;
    }
    async findOrAddShopCustomer(customer_mobile) {
        let user = await this.usersRepository.findOne({ where: { mobile: customer_mobile } });
        if (!user) {
            let userInput = {
                name: customer_mobile,
                mobile: customer_mobile,
                user_type: 'Customer',
                status: 'Active',
                is_available: false
            };
            user = await this.usersRepository.save(userInput);
        }
        return user;
    }
    async getCustomerByMobile(customer_mobile) {
        let user = await this.usersRepository.findOne({ where: { mobile: customer_mobile } });
        return user;
    }
    async getDriverBaseLocation(driver_id) {
        if (driver_id) {
            let bLoc = await this.baseLocationsRepo.findOne({ where: { unique_id: driver_id.toString() } });
            return bLoc;
        }
        else {
            return null;
        }
    }
    async getUnassignedCustomers() {
        let unassignedCustomers = await this.dataSource.query("select u.* from users u left join customer_company cc on cc.users like concat('%#',u.id,',%') where u.user_type='Customer' and cc.id is null ");
        return unassignedCustomers;
    }
    async addCustomerCompany(reqBody) {
        let companyData;
        if (reqBody.id) {
            const { id } = reqBody, updateFields = __rest(reqBody, ["id"]);
            const existing = await this.companyRepo.findOneBy({ id });
            const mergedData = Object.assign(Object.assign({}, existing), updateFields);
            companyData = await this.companyRepo.update({ id }, mergedData);
        }
        else {
            companyData = await this.companyRepo.save(reqBody);
        }
        return companyData;
    }
    async callGoodMoveAPI(apiUrl, data) {
        const baseUrl = process.env.ENV == 'test' ? this.configService.get('testApiBaseUrl') : this.configService.get('prodApiBaseUrl');
        const url = baseUrl + apiUrl;
        const options = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const respData = await (0, rxjs_1.lastValueFrom)(this.httpService.post(url, data, options).pipe((0, operators_1.map)(resp => resp.data)));
        return respData;
    }
    async sendBookingToSimulation(data) {
        const url = 'http://13.204.67.217:3000/add-booking';
        console.log("calling with ur ", url);
        const options = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const respData = await (0, rxjs_1.lastValueFrom)(this.httpService.post(url, data, options).pipe((0, operators_1.map)(resp => resp.data)));
        console.log("calling done ");
        return respData;
    }
};
UtilsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(categories_entity_1.CategoriesEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(driver_entity_1.DriversEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(driverSessions_entity_1.DriverSessionsEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(tourRoute_entity_1.TourRouteEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(cusomerCompanyDetails_1.CustomerCompanyEntity)),
    __param(8, (0, typeorm_1.InjectRepository)(baseLocations_entity_1.BaseLocationsEntity)),
    __param(9, (0, typeorm_1.InjectDataSource)()),
    __param(10, (0, typeorm_1.InjectRepository)(driverSessionDistance_entity_1.DriverSessionDistanceEntity)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        typeorm_2.Repository])
], UtilsService);
exports.UtilsService = UtilsService;
//# sourceMappingURL=utils.service.js.map