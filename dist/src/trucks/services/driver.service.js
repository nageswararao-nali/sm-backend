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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("../../users/models/users.entity");
const users_service_1 = require("../../users/services/users.service");
const utils_service_1 = require("../../utils/services/utils.service");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../models/driver.entity");
const locations_entity_1 = require("../models/locations.entity");
const driverSessions_entity_1 = require("../models/driverSessions.entity");
const location_service_1 = require("./location.service");
const truck_service_1 = require("./truck.service");
const moment = require("moment");
const gmTruckerRates_1 = require("../models/gmTruckerRates");
const gmTruckerPayments_1 = require("../models/gmTruckerPayments");
const tours_entity_1 = require("../../tours/models/tours.entity");
const driverSessionDistance_entity_1 = require("../models/driverSessionDistance.entity");
const booking_entity_1 = require("../../bookings/models/booking.entity");
const tourRoute_entity_1 = require("../../tours/models/tourRoute.entity");
const gmDriverRates_1 = require("../models/gmDriverRates");
const driverTransactions_1 = require("../models/driverTransactions");
const node_1 = require("read-excel-file/node");
const fs = require("fs");
const aws_sdk_1 = require("aws-sdk");
const config_1 = require("@nestjs/config");
const userLogin_entity_1 = require("../../users/models/userLogin.entity");
const driverSessionSummary_entity_1 = require("../models/driverSessionSummary.entity");
const cusomerCompanyDetails_1 = require("../models/cusomerCompanyDetails");
const nodemailer = require("nodemailer");
const pdf = require("html-pdf");
const driverLastLocDetails_1 = require("../models/driverLastLocDetails");
var mail = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
let DriverService = class DriverService {
    constructor(driverRepository, usersRepository, dsRepository, locationsRepo, truckerRateRepo, truckerPaymentRepo, toursEntity, driverSessionDistance, bookingRepo, tourRouteRepo, driverRates, driverTransactions, userLoginRepo, dssRepo, companyRepo, driverLastLocRepo, utilsService, truckService, userService, locService, configService) {
        this.driverRepository = driverRepository;
        this.usersRepository = usersRepository;
        this.dsRepository = dsRepository;
        this.locationsRepo = locationsRepo;
        this.truckerRateRepo = truckerRateRepo;
        this.truckerPaymentRepo = truckerPaymentRepo;
        this.toursEntity = toursEntity;
        this.driverSessionDistance = driverSessionDistance;
        this.bookingRepo = bookingRepo;
        this.tourRouteRepo = tourRouteRepo;
        this.driverRates = driverRates;
        this.driverTransactions = driverTransactions;
        this.userLoginRepo = userLoginRepo;
        this.dssRepo = dssRepo;
        this.companyRepo = companyRepo;
        this.driverLastLocRepo = driverLastLocRepo;
        this.utilsService = utilsService;
        this.truckService = truckService;
        this.userService = userService;
        this.locService = locService;
        this.configService = configService;
    }
    async addDriver(reqBody) {
        const driverInput = {
            "truck_owner_id": reqBody.truck_owner_id,
            "name": reqBody.name,
            "mobile_number": reqBody.mobile_number,
            "license_number": reqBody.license_number,
            "status": "Available",
            "truck_id": reqBody.truck_id,
            "user_id": reqBody.user_id
        };
        const driverData = await this.driverRepository.save(driverInput);
        return driverData;
    }
    async getDriver(reqBody) {
        const driverData = await this.driverRepository.findOneBy(reqBody);
        return driverData;
    }
    async driverDetails(mobile) {
        let driverDetails = {};
        const driverData = await this.driverRepository.findOne({ where: { mobile_number: mobile } });
        driverDetails.driverData = driverData;
        const userData = await this.userService.getUserById(driverData.user_id);
        driverDetails.userData = userData;
        return driverDetails;
    }
    async updateDriver(id, reqBody) {
        delete reqBody.mobile_number;
        const driverData = await this.driverRepository.update({ user_id: id }, reqBody);
        return driverData;
    }
    async updateDriverLastLocDetails(reqBody) {
        const pointObject = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        let lastDetails = {
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            location: pointObject,
            last_tracked_at: moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        };
        const lastDriverDetails = await this.driverLastLocRepo.findOne({ where: { driver_id: reqBody.user_id } });
        const driverData = await this.driverRepository.findOneBy({ user_id: reqBody.user_id });
        const user = await this.usersRepository.findOneBy({ id: reqBody.user_id });
        if (user.is_available) {
            if (lastDriverDetails) {
                if (lastDriverDetails.truck_id != driverData.truck_id) {
                    const truckData = await this.truckService.getTruck(driverData.truck_id);
                    lastDetails.truck_id = driverData.truck_id;
                    lastDetails.vehicle_type = truckData.vehicle_type;
                }
                await this.driverLastLocRepo.update({ driver_id: reqBody.user_id }, lastDetails);
            }
            else {
                const truckData = await this.truckService.getTruck(driverData.truck_id);
                lastDetails.truck_id = driverData.truck_id;
                lastDetails.vehicle_type = truckData.vehicle_type;
                lastDetails.driver_id = reqBody.user_id;
                await this.driverLastLocRepo.save(lastDetails);
            }
        }
        else if (lastDriverDetails) {
            await this.driverLastLocRepo.delete({ driver_id: reqBody.user_id });
        }
        return;
    }
    async deleteDriver(id) {
        const driverData = await this.driverRepository.delete(id);
        return driverData;
    }
    async deleteByOwner(id) {
        const driverData = await this.driverRepository.delete({ truck_owner_id: id });
        return driverData;
    }
    async getDrivers(reqBody) {
        var _a, e_1, _b, _c;
        const offset = reqBody.offset || 0;
        const limit = reqBody.limit || 10;
        const count = await this.driverRepository.createQueryBuilder('driver').getCount();
        const items = await this.driverRepository.createQueryBuilder('driver')
            .leftJoin('users', 'u', 'u.id = driver.user_id')
            .orderBy('u.is_available', 'DESC', 'NULLS LAST')
            .addOrderBy('driver.last_tracked_at', 'DESC', 'NULLS LAST')
            .limit(limit)
            .offset(offset)
            .getMany();
        let drivers = [];
        try {
            for (var _d = true, items_1 = __asyncValues(items), items_1_1; items_1_1 = await items_1.next(), _a = items_1_1.done, !_a;) {
                _c = items_1_1.value;
                _d = false;
                try {
                    const driver = _c;
                    driver['truck_owner_name'] = await this.utilsService.getName(driver.truck_owner_id);
                    const truckData = await this.truckService.getTruck(driver.truck_id);
                    driver['vehicle_number'] = truckData ? truckData.registration_number : '';
                    const userData = await this.userService.getUserById(driver.user_id);
                    driver['available_status'] = userData ? userData.is_available : '';
                    const baseLoc = await this.utilsService.getDriverBaseLocation(driver.user_id);
                    driver['baseLocation'] = baseLoc;
                    drivers.push(driver);
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = items_1.return)) await _b.call(items_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return { drivers, count };
    }
    async createSession(seqData, reqBody) {
        const driverSessionInput = {
            "start_location": seqData.id,
            "user_id": reqBody.user_id,
            "status": true,
            "total_time": reqBody.total_time ? reqBody.total_time : 0,
            "total_distance": reqBody.total_distance ? reqBody.total_distance : '0.0',
            "start_odometer_reading": reqBody.start_odometer_reading ? reqBody.start_odometer_reading : 1050,
            "session_start_time": reqBody.session_start_time ? (reqBody.session_start_time) : moment(new Date()),
        };
        const driverData = await this.dsRepository.save(driverSessionInput);
        return driverData;
    }
    async updateSessionTours(session_id, driver_id, start_time, end_time) {
        let whereCon = {};
        let bookingIds = [];
        let bookingTourIds = [];
        if (start_time) {
            whereCon['reached_pickup'] = (0, typeorm_2.Between)(start_time, end_time);
        }
        console.log(whereCon);
        const items = await this.bookingRepo.find({ where: whereCon, order: { id: 'ASC' } });
        for (let booking of items) {
            bookingIds.push(booking.id);
        }
        console.log("bookingIds");
        console.log(bookingIds);
        const tourRoutes = await this.tourRouteRepo.find({ where: { booking_id: (0, typeorm_2.In)(bookingIds) }, order: { booking_id: 'ASC' } });
        for (let tourRoute of tourRoutes) {
            console.log();
            if (tourRoute.tour_id) {
                bookingTourIds.push(tourRoute.tour_id);
            }
        }
        bookingTourIds = [...new Set(bookingTourIds)];
        console.log("bookingTourIds");
        console.log(bookingTourIds);
        for (let tour_id of bookingTourIds) {
            const tourData = await this.toursEntity.findOneBy({ id: tour_id, driver_id: driver_id });
            if (tourData) {
                const tourSequence = await this.tourRouteRepo.find({ where: { tour_id: tour_id }, order: { sequence_number: 'ASC' } });
                if (tourSequence && tourSequence.length) {
                    let bookingId = tourSequence[0].booking_id;
                    let bookingData = await this.bookingRepo.findOneBy({ id: bookingId });
                    if (bookingData.reached_pickup >= start_time && bookingData.reached_pickup < end_time) {
                        const tDistance = await this.locService.calcTourDistance(tour_id);
                        let sessionDistanceData = {
                            session_id: session_id,
                            tour_id: tour_id,
                            distance: tDistance,
                            tour_type: tourData.tour_type
                        };
                        const existingTourDistance = await this.driverSessionDistance.findOneBy({ tour_id: tour_id });
                        if (existingTourDistance && existingTourDistance.id) {
                            await this.driverSessionDistance.update({ id: existingTourDistance.id }, sessionDistanceData);
                        }
                        else {
                            await this.driverSessionDistance.save(sessionDistanceData);
                        }
                    }
                }
            }
        }
    }
    async createSessionByManager(seqData, reqBody) {
        const driverSessionInput = {
            "start_location": seqData.id,
            "user_id": reqBody.user_id,
            "status": false,
            "total_time": reqBody.total_time ? reqBody.total_time : 0,
            "total_distance": reqBody.total_distance ? reqBody.total_distance : '0.0',
            "start_odometer_reading": reqBody.start_odometer_reading ? reqBody.start_odometer_reading : 1050,
            "end_odometer_reading": reqBody.end_odometer_reading ? reqBody.end_odometer_reading : 1050,
            "session_start_time": reqBody.session_start_time ? (reqBody.session_start_time) : '',
            "session_end_time": reqBody.session_end_time ? (reqBody.session_end_time) : '',
            "final_fare": reqBody.final_fare ? reqBody.final_fare : 0
        };
        const sessionData = await this.dsRepository.save(driverSessionInput);
        const session_start_time = moment(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time);
        const session_end_time = moment(reqBody.session_end_time ? reqBody.session_end_time : sessionData.session_end_time);
        console.log(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time);
        console.log(session_start_time);
        await this.updateSessionTours(sessionData.id, sessionData.user_id, session_start_time, session_end_time);
        return sessionData;
    }
    async createTourSession(inputData) {
        const sessionData = await this.dsRepository.save(inputData);
        return sessionData;
    }
    async getLatestSession(user_id) {
        let tour_ids = [];
        const exceptStatus = ['Completed'];
        let tour_count = 0;
        let distance = 0;
        let sessionData = await this.dsRepository.findOne({ where: { user_id: user_id, status: true }, order: { id: 'DESC' } });
        if (sessionData && sessionData.id) {
            let [items, count] = await this.driverSessionDistance.findAndCount({ where: { session_id: sessionData.id } });
            for (let item of items) {
                let tourData = await this.toursEntity.findOne({ where: { id: item.tour_id, status: (0, typeorm_2.Not)((0, typeorm_2.In)(exceptStatus)) } });
                if (!tourData) {
                    distance = distance + parseFloat(item.distance);
                    tour_count++;
                }
            }
        }
        let activeSessionData = Object.assign(Object.assign({}, sessionData), { no_tours: tour_count, total_distance: distance });
        return activeSessionData;
    }
    async getDriverLatestSession(user_id) {
        let sessionData = await this.dsRepository.findOne({ where: { user_id: user_id }, order: { id: 'DESC' } });
        return sessionData;
    }
    async getClosedSession(user_id, session_date) {
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'));
        let nextDay = new Date(created_at_date);
        nextDay.setDate(created_at_date.getDate() + 1);
        const whereCond = {
            user_id: user_id,
            session_start_time: (0, typeorm_2.Between)(session_date, nextDay),
            is_closed_session: true
        };
        console.log("whereCond");
        console.log(whereCond);
        const closedSession = await this.dsRepository.findOne({ where: whereCond, order: { id: 'DESC' } });
        return closedSession;
    }
    async updateDriverSession(user_id) {
        const sessionData = await this.dsRepository.findOne({ where: { user_id: user_id }, order: { id: 'DESC' } });
        if (sessionData) {
            const updateSession = await this.dsRepository.update({ id: sessionData.id }, { status: false, session_end_time: moment(new Date()) });
        }
        return sessionData;
    }
    async getLatestSessions(reqBody) {
        let sessions = [];
        const exceptStatus = ['Completed'];
        let whereCon = {};
        whereCon['user_id'] = reqBody.user_id;
        if (reqBody.session_date) {
            let reached_date = moment(reqBody.session_date);
            let nextDay = moment(reached_date).add(1, 'days');
            whereCon["session_start_time"] = (0, typeorm_2.Between)(reached_date, nextDay);
        }
        if (reqBody.driver_id) {
            whereCon['user_id'] = reqBody.driver_id;
        }
        if (reqBody.paid) {
            whereCon['paid'] = reqBody.paid;
        }
        const [items, count] = await this.dsRepository.findAndCount({ where: whereCon, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        for (let sessionData of items) {
            let sDistances = await this.driverSessionDistance.find({ where: { session_id: sessionData.id } });
            let distance = 0;
            let no_tours = 0;
            if (sDistances && sDistances.length) {
                for (let item of sDistances) {
                    let tourData = await this.toursEntity.findOne({ where: { id: item.tour_id, status: (0, typeorm_2.Not)((0, typeorm_2.In)(exceptStatus)) } });
                    if (!tourData) {
                        distance = distance + parseFloat(item.distance);
                        no_tours++;
                    }
                }
            }
            let session = Object.assign(Object.assign({}, sessionData), { total_distance: distance, no_tours: no_tours });
            sessions.push(session);
        }
        return { sessions, count };
    }
    async getAllSessions(reqBody) {
        let allSessions = [];
        const exceptStatus = ['Completed'];
        const sessions = await this.dsRepository.createQueryBuilder("gs")
            .leftJoinAndSelect("drivers", "d", "d.user_id=gs.user_id")
            .leftJoinAndSelect("trucks", "t", "t.id=d.truck_id")
            .leftJoinAndSelect("users", "u", "u.id=t.truck_owner_id")
            .select(['gs.*, d.name as driver_name, d.mobile_number as driver_mobile, t.registration_number as vehicle_number, u.name as truck_owner_id'])
            .orderBy('id', 'DESC')
            .limit(reqBody.limit)
            .offset(reqBody.offset)
            .getRawMany();
        for (let session of sessions) {
            let distance = 0;
            let no_tours = 0;
            let tour_ids = [];
            let sDistances = await this.driverSessionDistance.find({ where: { session_id: session.id } });
            if (sDistances && sDistances.length) {
                for (let item of sDistances) {
                    let tourData = await this.toursEntity.findOne({ where: { id: item.tour_id, status: (0, typeorm_2.Not)((0, typeorm_2.In)(exceptStatus)) } });
                    if (!tourData) {
                        distance = distance + parseFloat(item.distance);
                        tour_ids.push(item.tour_id);
                        no_tours++;
                    }
                }
            }
            const trips_info = await this.locService.getTripsIdsByTourIdsId(tour_ids);
            let sessionData = Object.assign(Object.assign({}, session), { total_distance: distance, no_tours: no_tours, no_trips: trips_info.length });
            console.log(sessionData);
            allSessions.push(sessionData);
        }
        return allSessions;
    }
    async updateDistance(user_id, distance) {
        const sessionData = await this.dsRepository.findOne({ where: { user_id: user_id, status: true }, order: { id: 'DESC' } });
        if (sessionData) {
            const total_distance = parseFloat(sessionData.total_distance) + parseFloat(distance ? distance : 0);
            const updateSession = await this.dsRepository.update({ id: sessionData.id }, { total_distance: total_distance, session_end_time: moment(new Date()) });
        }
        return sessionData;
    }
    async updateSession(id, reqBody) {
        const sessionData = await this.dsRepository.findOneBy({ id });
        const lastFare = sessionData.final_fare;
        const updateSessionData = await this.dsRepository.update(id, reqBody);
        const session_start_time = moment(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time);
        const session_end_time = moment(reqBody.session_end_time ? reqBody.session_end_time : sessionData.session_end_time);
        if (reqBody.final_fare != lastFare) {
            let driverData = await this.driverRepository.findOne({ where: { user_id: sessionData.user_id } });
            await this.addDriverTransaction(driverData, lastFare, 'Debit', 'Edited Fare from Manager Interface for session ' + id);
            driverData = await this.driverRepository.findOne({ where: { user_id: sessionData.user_id } });
            await this.addDriverTransaction(driverData, parseInt(reqBody.final_fare), 'Credit', 'Edited Fare from Manager Interface for session ' + id);
        }
        await this.updateSessionTours(sessionData.id, sessionData.user_id, session_start_time, session_end_time);
        return updateSessionData;
    }
    async deleteSession(id) {
        const sessionData = await this.dsRepository.delete(id);
        return sessionData;
    }
    async addTruckerRate(reqBody) {
        const driverData = await this.driverRepository.findOneBy({ user_id: reqBody.driver_id });
        if (driverData) {
            const truckData = await this.truckService.getTruck(driverData.truck_id);
            let truckerRateObj = {
                "driver_id": reqBody.driver_id,
                "driver_name": driverData.name,
                "truck_id": driverData.truck_id,
                "vehicle_no": truckData ? truckData.registration_number : '',
                "base_rate": reqBody.base_rate,
                "base_distance": reqBody.base_distance,
                "base_duration": reqBody.base_duration,
                "rate_per_km": reqBody.rate_per_km,
                "rate_per_hr": reqBody.rate_per_hr
            };
            const truckerRateData = await this.truckerRateRepo.save(truckerRateObj);
            return truckerRateData;
        }
        else {
            return false;
        }
    }
    async updateTruckerRate(driver_id, reqBody) {
        const driverData = await this.driverRepository.findOneBy({ id: driver_id });
        if (driverData) {
            const truckData = await this.truckService.getTruck(driverData.truck_id);
            let truckerRateObj = {
                "driver_name": driverData.name,
                "truck_id": driverData.truck_id,
                "vehicle_no": truckData ? truckData.registration_number : '',
                "base_rate": reqBody.base_rate,
                "base_distance": reqBody.base_distance,
                "base_duration": reqBody.base_duration,
                "rate_per_km": reqBody.rate_per_km,
                "rate_per_hr": reqBody.rate_per_hr
            };
            const truckerRateData = await this.truckerRateRepo.update({ driver_id: driver_id }, truckerRateObj);
            return truckerRateData;
        }
        else {
            return false;
        }
    }
    async truckersRateList(reqBody) {
        const [items, count] = await this.truckerRateRepo.findAndCount({ order: { created_at: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async driverPaymentCalculation(reqBody) {
        const paymentDate = reqBody.payment_date;
        const reportDate = new Date(paymentDate);
        let nextDate = new Date(paymentDate);
        nextDate.setDate(nextDate.getDate() + 1);
        await this.truckerPaymentRepo.delete({ payment_date: paymentDate });
        let driversList = await this.dsRepository.find({ where: { session_start_time: (0, typeorm_2.Between)(paymentDate, nextDate) } });
        let driverIds = [];
        for (let driver of driversList) {
            driverIds.push(driver.user_id);
        }
        driverIds = [...new Set(driverIds)];
        for (let driverId of driverIds) {
            let totalDistance = 0;
            let totalTime = 0;
            let totalPrice = 0;
            let notes = '';
            let sessions = await this.dsRepository.find({ where: { user_id: driverId, session_start_time: (0, typeorm_2.Between)(paymentDate, nextDate) } });
            let pay_start_time = sessions[0].session_start_time;
            let pay_end_time = sessions[sessions.length - 1].session_end_time;
            for (let sessionData of sessions) {
                totalDistance = totalDistance + parseInt(sessionData.total_distance);
                let startTime = moment(sessionData.session_start_time);
                let endTime = moment(sessionData.session_end_time);
                let diff = endTime.diff(startTime, 'minutes');
                totalTime = totalTime + diff;
            }
            let driverRatedata = await this.truckerRateRepo.findOneBy({ driver_id: driverId });
            if (driverRatedata) {
                totalPrice = driverRatedata.base_rate;
                notes = notes + 'base rate ' + driverRatedata.base_rate + ' ';
                if (totalDistance > driverRatedata.base_distance) {
                    let cal_distance = totalDistance - driverRatedata.base_distance;
                    totalPrice = totalPrice + (cal_distance * driverRatedata.rate_per_km);
                    notes = notes + 'distance ' + cal_distance + ', rate=' + driverRatedata.rate_per_km + ' ';
                }
                if (totalTime > driverRatedata.base_duration) {
                    let cal_time = totalTime - driverRatedata.base_duration;
                    let cal_time_in_hrs = Math.ceil(cal_time / 60);
                    totalPrice = totalPrice + (cal_time_in_hrs * driverRatedata.rate_per_hr);
                    notes = notes + 'duration ' + cal_time_in_hrs + ', rate=' + driverRatedata.rate_per_hr + ' ';
                }
            }
            let driverData = await this.driverRepository.findOneBy({ id: driverId });
            const truckData = await this.truckService.getTruck(driverData.truck_id);
            let driverPaymentData = {
                driver_id: driverId,
                driver_name: driverData.name,
                owner_name: await this.utilsService.getName(driverData.truck_owner_id),
                truck_id: truckData ? truckData.registration_number : '',
                vehicle_no: driverData.name,
                start_time: pay_start_time,
                end_time: pay_end_time,
                payment_date: paymentDate,
                distance: totalDistance,
                duration: totalTime,
                amount: totalPrice,
                status: 'Pending',
                notes: notes
            };
            await this.truckerPaymentRepo.save(driverPaymentData);
        }
        return true;
    }
    async sendInactiveNotification(reqBody) {
        let data = [];
        const drivers = await this.driverRepository.find();
        for (let driver of drivers) {
            let userDetials = await this.utilsService.getUserDetails(driver.user_id);
            if (userDetials && userDetials.is_available) {
                let start_time = moment(driver.last_notification_at);
                let last_captured_time = moment(driver.last_tracked_at);
                let end_time = moment();
                let last_diff = end_time.diff(start_time, 'minutes');
                let track_diff = end_time.diff(last_captured_time, 'minutes');
                data.push({ id: driver.user_id, last_time: start_time, last_diff, noe_time: end_time, track_diff });
                if (!driver.last_notification_at || (last_diff > 5 && track_diff > 5)) {
                    const userToken = userDetials.device_token;
                    const TITLE = 'Alert!';
                    const BODY = 'We are currently unable to track you. Please ensure that the app is still running in the background.';
                    await this.driverRepository.update({ id: driver.id }, { last_notification_at: new Date() });
                }
            }
        }
        return data;
    }
    async calculateSessionFareWithScheme1(ratesData, distance, hours) {
        console.log("cal scheme1");
        let notes = '';
        let total_fare = ratesData.base_rate;
        notes = notes + "base_rate = " + ratesData.base_rate + ", ";
        if (distance > ratesData.base_distance) {
            let diff_distance = distance - ratesData.base_distance;
            total_fare = total_fare + (diff_distance * ratesData.rate_per_km);
            notes = notes + "total distance=" + distance + ", " + "distance diff = " + diff_distance + "*" + ratesData.rate_per_km + ", ";
        }
        if (hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr);
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*" + ratesData.rate_per_hr + ", ";
        }
        console.log(total_fare);
        console.log(notes);
        total_fare = Math.ceil(total_fare);
        return { total_fare, notes };
    }
    async calculateSessionFareWithScheme2(ratesData, distance, hours) {
        let notes = '';
        let total_distance = distance;
        let total_fare = ratesData.base_rate;
        notes = notes + "base_rate = " + ratesData.base_rate + ", ";
        let schemeDistanceData = ratesData.rate_per_km.split(",");
        notes = notes + "total distance=" + distance + ", ";
        for (let schemeDistance of schemeDistanceData) {
            if (total_distance > 0) {
                let schemeData = schemeDistance.split(":");
                let nextDistance = schemeData[0];
                let nextRate = schemeData[1];
                let cal_distance = total_distance - nextDistance;
                if (total_distance >= nextDistance) {
                    total_fare = total_fare + (nextDistance * nextRate);
                    notes = notes + "dis diff = " + nextDistance + "*" + nextRate + ", ";
                }
                else {
                    total_fare = total_fare + (total_distance * nextRate);
                    notes = notes + "dis diff = " + total_distance + "*" + nextRate + ", ";
                }
                total_distance = total_distance - nextDistance;
            }
        }
        if (total_distance > 0) {
            total_fare = total_fare + total_distance * schemeDistanceData[schemeDistanceData.length - 1].split(":")[1];
            notes = notes + "dis diff = " + total_distance + "*" + schemeDistanceData[schemeDistanceData.length - 1].split(":")[1] + ", ";
        }
        if (hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr);
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*" + ratesData.rate_per_hr + ", ";
        }
        console.log(total_fare);
        console.log(notes);
        total_fare = Math.ceil(total_fare);
        return { total_fare, notes };
    }
    async calculateSessionFareWithScheme3(ratesData, distance, hours) {
        console.log("cal scheme1");
        let notes = '';
        let total_fare = ratesData.base_rate;
        notes = notes + "base_rate = " + ratesData.base_rate + ", ";
        if (hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            diff_hours = Math.round(diff_hours * 100) / 100;
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr);
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*" + ratesData.rate_per_hr + ", ";
        }
        console.log(total_fare);
        console.log(notes);
        total_fare = Math.ceil(total_fare);
        return { total_fare, notes };
    }
    async addDriverTransaction(driverData, amount, transaction_type, notes, ref_file = '', trans_date = '') {
        let balance = 0;
        if (transaction_type == 'Credit') {
            balance = (driverData.wallet ? driverData.wallet : 0) + (amount ? amount : 0);
        }
        else {
            balance = (driverData.wallet ? driverData.wallet : 0) - (amount ? amount : 0);
        }
        const transaction_date = trans_date ? trans_date : moment().tz('Asia/Calcutta').format('YYYY-MM-DD');
        const transaction_date_time = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
        console.log("transaction date ", transaction_date, trans_date);
        const driverTransaction = {
            driver_id: driverData.id,
            user_id: driverData.user_id,
            driver_name: driverData.name,
            transaction_type,
            amount,
            balance,
            transaction_date,
            transaction_date_time,
            notes,
            ref_file
        };
        await this.driverTransactions.save(driverTransaction);
        await this.driverRepository.update({ id: driverData.id }, { wallet: balance });
        return true;
    }
    async calculateSessionFare(sessionId) {
        let distance = 0;
        let duration = 0;
        let schemeType = 'scheme2';
        let truckType = 'Dost';
        let total_fare = 0;
        let notes = '';
        console.log("step 3");
        let sessionData = await this.dsRepository.findOneBy({ id: sessionId });
        console.log(sessionData);
        if (sessionData.session_end_time) {
            console.log("step 4");
            let [items] = await this.driverSessionDistance.findAndCount({ where: { session_id: sessionData.id } });
            for (let item of items) {
                distance = distance + parseFloat(item.distance);
            }
            let start_time = moment(sessionData.session_start_time);
            let end_time = moment(sessionData.session_end_time);
            let duration_time = moment.duration(end_time.diff(start_time));
            let hours = duration_time.asHours();
            let driverData = await this.driverRepository.findOne({ where: { user_id: sessionData.user_id } });
            if (driverData && driverData.scheme_name) {
                schemeType = driverData.scheme_name;
                console.log("truck id", driverData.truck_id);
                const truckData = await this.truckService.getTruck(driverData.truck_id);
                if (truckData && truckData.vehicle_type) {
                    truckType = truckData.vehicle_type;
                }
            }
            distance = Math.ceil(distance);
            hours = hours.toFixed(2);
            let fareData = {
                total_fare: 0,
                notes: 'No distance travelled'
            };
            console.log({ scheme_name: schemeType, truck_type: truckType });
            let ratesData = await this.driverRates.findOne({ where: { scheme_name: schemeType, truck_type: truckType } });
            console.log(ratesData);
            console.log(distance);
            console.log(hours);
            if (distance > 0) {
                if (schemeType == 'scheme1') {
                    fareData = await this.calculateSessionFareWithScheme1(ratesData, distance, hours);
                }
                else if (schemeType == 'scheme2') {
                    fareData = await this.calculateSessionFareWithScheme2(ratesData, distance, hours);
                }
                else if (schemeType == 'scheme3') {
                    fareData = await this.calculateSessionFareWithScheme3(ratesData, distance, hours);
                }
            }
            let updSessionData = await this.dsRepository.update({ id: sessionId }, { total_distance: distance.toString(), total_time: hours, fare: fareData.total_fare, final_fare: fareData.total_fare, notes: fareData.notes });
            console.log("step 5");
            console.log({ total_distance: distance.toString(), total_time: hours, fare: fareData.total_fare, final_fare: fareData.total_fare, notes: fareData.notes });
        }
        return true;
    }
    async updateSessionFare(reqBody) {
        let updSessionData = await this.dsRepository.update({ id: reqBody.sessionId }, { final_fare: reqBody.total_fare });
        return updSessionData;
    }
    async updateUserLogin(user, is_available) {
        let latestLoc = await this.locationsRepo.findOne({ where: { user_id: user.id }, order: { id: 'DESC' } });
        if (latestLoc) {
            if (is_available) {
                const rndInt = Math.floor(Math.random() * 5) + 1;
                setTimeout(async () => {
                    let userLogData = await this.userLoginRepo.findOne({ where: { user_id: user.id }, order: { id: "DESC" } });
                    if (!userLogData || userLogData.loggedout_time) {
                        let reqObj = {
                            user_id: user.id,
                            login_latitude: latestLoc.latitude,
                            login_longitude: latestLoc.longitude,
                            login_location: latestLoc.location,
                            log_date: moment(new Date()).format('YYYY-MM-DD'),
                            loggedin_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        };
                        await this.userLoginRepo.save(reqObj);
                    }
                }, 1000 * rndInt);
            }
            else {
                let userLogData = await this.userLoginRepo.findOne({ where: { user_id: user.id }, order: { id: "DESC" } });
                if (userLogData && !userLogData.loggedout_time) {
                    let updObj = {
                        logout_latitude: latestLoc.latitude,
                        logout_longitude: latestLoc.longitude,
                        logout_location: latestLoc.location,
                        loggedout_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                    };
                    await this.userLoginRepo.update({ id: userLogData.id }, updObj);
                }
            }
        }
        return true;
    }
    async updateAvailable(mobile, is_available) {
        const userData = await this.usersRepository.findOneBy({ mobile: mobile });
        if (userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({ mobile }, { "is_available": is_available });
            await this.updateUserLogin(userData, is_available);
            let TITLE = 'Hello #';
            let BODY = '';
            if (!is_available) {
                console.log("step 1");
                console.log(userData.id);
                BODY = 'Your tours have been completed. Thank you for your co-operation. Have a good day!';
                let sessionData = await this.utilsService.closeSession(userData.id);
                console.log("step 2");
                console.log(sessionData);
                if (sessionData) {
                    await this.calculateSessionFare(sessionData.id);
                }
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
    async updateAvailableById(user_id, is_available, from_manager = false) {
        const userData = await this.usersRepository.findOneBy({ id: user_id });
        if (userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({ id: user_id }, { "is_available": is_available });
            if (!from_manager) {
                await this.updateUserLogin(userData, is_available);
            }
            let TITLE = 'Hello #';
            let BODY = '';
            if (!is_available) {
                BODY = 'Your tours have been completed. Thank you for your co-operation. Have a good day!';
                let sessionData = await this.utilsService.closeSession(user_id, from_manager);
                if (sessionData) {
                    await this.calculateSessionFare(sessionData.id);
                }
                await this.driverLastLocRepo.delete({ driver_id: userData.id });
            }
            else {
                BODY = 'You will be assigned tours shortly. Have a good day!';
            }
            if (userData.device_token && !from_manager) {
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
    async payDriverFare(file) {
        const schema = {
            'Driver user id': {
                prop: 'driver_id'
            },
            'AMOUNT': {
                prop: 'amount'
            }
        };
        let data = await (0, node_1.default)(file.buffer, { schema });
        if (data.rows.length) {
            const { originalname } = file;
            const bucketS3 = this.configService.get('CUSTOMER_RECEIPTS_BUCKET_NAME');
            const uploadedData = await this.uploadS3(file.buffer, bucketS3, originalname);
            const file_location = uploadedData.Location;
            for (let row of data.rows) {
                console.log(row);
                const driverId = row['driver_id'];
                let driverData = await this.driverRepository.findOne({ where: { id: driverId } });
                if (driverData) {
                    const amount = row['amount'];
                    await this.addDriverTransaction(driverData, parseInt(amount), 'Debit', 'From Manager Interface', file_location);
                }
            }
        }
        return true;
    }
    async uploadS3(file, bucket, name) {
        const s3 = this.getS3();
        const params = {
            Bucket: bucket,
            Key: String(name),
            Body: file,
        };
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
    async getDriverTransactions(reqBody) {
        let whereCond = {};
        if (reqBody.driver_id) {
            whereCond['user_id'] = reqBody.driver_id;
        }
        let [items, count] = await this.driverTransactions.findAndCount({ where: whereCond, order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async getDriverCumulativeEarnings(reqBody) {
        let totalEarnings = 0;
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dateStr = moment(firstDay).format('YYYY-MM');
        console.log("dateStr");
        console.log(dateStr);
        let transactions = await this.driverTransactions.find({ where: { user_id: reqBody.user_id, transaction_date: (0, typeorm_2.Like)(`${dateStr}%`) } });
        for (let transaction of transactions) {
            console.log(transaction.amount);
            totalEarnings += transaction.amount;
        }
        return totalEarnings;
    }
    async getLatestTourCompleteTime(driver_id, tourId = 0) {
        let sessionCloseTime = '';
        let whereCond = { driver_id: driver_id };
        if (tourId) {
            whereCond['id'] = (0, typeorm_2.LessThan)(tourId);
        }
        console.log(whereCond);
        let latestTour = await this.toursEntity.findOne({ where: whereCond, order: { id: 'DESC' } });
        if (latestTour) {
            if (latestTour.status == 'Rejected') {
                sessionCloseTime = await this.getLatestTourCompleteTime(driver_id, latestTour.id);
            }
            else {
                sessionCloseTime = latestTour.complete_time;
            }
        }
        else {
            console.log(driver_id, ' ********');
        }
        return sessionCloseTime;
    }
    async autoSessionClose() {
        const exceptStatus = ['Completed', 'Rejected'];
        let notes = '';
        const activeSessions = await this.dsRepository.find({ where: { status: true } });
        console.log("active sessions lenght ", activeSessions.length);
        notes = notes + "active sessions lenght " + activeSessions.length + " ==== ";
        try {
            for (let activeSession of activeSessions) {
                console.log(activeSession.user_id, activeSession.id);
                let sessionCloseTime = '';
                let activeTours = await this.toursEntity.find({ where: { driver_id: activeSession.user_id, status: (0, typeorm_2.Not)((0, typeorm_2.In)(exceptStatus)) } });
                if (!activeTours.length) {
                    sessionCloseTime = await this.getLatestTourCompleteTime(activeSession.user_id);
                }
                if (sessionCloseTime) {
                    const finalCloseTime = moment(new Date(sessionCloseTime)).subtract({ hours: 5, minutes: 30 }).format('YYYY-MM-DD HH:mm:ss');
                    console.log("sess upd ", activeSession.id, finalCloseTime);
                    notes = notes + "sess upd " + activeSession.id + finalCloseTime + " ---- ";
                    await this.dsRepository.update({ id: activeSession.id }, { session_end_time: finalCloseTime, updated_at: new Date() });
                    await this.updateAvailableById(activeSession.user_id, false, true);
                }
            }
            return notes;
        }
        catch (e) {
            return false;
        }
    }
    async driverMonthlyFare() {
        const monthNames = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let date = new Date();
        let monthNum = date.getMonth();
        let yearNum = date.getFullYear();
        let dateStr = "";
        console.log("monthNum");
        console.log(monthNum);
        let schemeType = 'scheme3';
        if (monthNum == 0) {
            yearNum = yearNum - 1;
            monthNum = 12;
        }
        dateStr = yearNum + "-" + monthNum + "-";
        console.log("monthNum", monthNum, yearNum);
        const [items, count] = await this.driverRepository.findAndCount({ where: { scheme_name: schemeType } });
        if (count) {
            for (let driverData of items) {
                console.log(driverData);
                let driverTravelledDistance = 0;
                let truckType = 'Dost';
                let whereCon = {
                    user_id: driverData.user_id,
                    session_date: (0, typeorm_2.Like)(`${dateStr}%`)
                };
                let ratesData = await this.driverRates.findOne({ where: { scheme_name: schemeType, truck_type: truckType } });
                let sessionsSummary = await this.dssRepo.find({ where: whereCon });
                if (sessionsSummary.length) {
                    for (let sess of sessionsSummary) {
                        if (ratesData.base_distance > parseInt(sess.total_distance)) {
                            let dis = ratesData.base_distance - parseInt(sess.total_distance);
                            driverTravelledDistance += dis;
                        }
                    }
                }
                if (driverData && driverData.scheme_name && driverTravelledDistance) {
                    schemeType = driverData.scheme_name;
                    console.log("truck id", driverData.truck_id);
                    const truckData = await this.truckService.getTruck(driverData.truck_id);
                    if (truckData && truckData.vehicle_type) {
                    }
                    console.log("ratesData");
                    console.log(ratesData);
                    console.log(truckType);
                    if (driverTravelledDistance > 0) {
                        let fare = driverTravelledDistance * parseInt(ratesData.rate_per_km);
                        await this.addDriverTransaction(driverData, fare, 'Credit', 'For Month ' + monthNames[monthNum - 1] + ", year " + yearNum);
                    }
                }
            }
        }
        else {
            return false;
        }
    }
    async calculateDriverFareById(driverId, calc_date) {
        let distance = 0;
        let duration = 0;
        let schemeType = 'scheme2';
        let truckType = 'Dost';
        let revenue = 0;
        let additional_fare_comments = '';
        let additional_loading_fare = 0;
        let additional_toll_fare = 0;
        let session_ids = '';
        let fareData = {
            total_fare: 0,
            notes: 'No distance travelled'
        };
        let tourId_notes = ' tour ids = ';
        let no_local_trips = 0;
        let no_long_haul_trips = 0;
        let session_date = calc_date;
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'));
        let nextDay = new Date(created_at_date);
        nextDay.setDate(created_at_date.getDate() + 1);
        const whereCond = {
            session_start_time: (0, typeorm_2.Between)(session_date, nextDay),
            user_id: driverId
        };
        let sessions = await this.dsRepository.find({ where: whereCond });
        let driverData = await this.driverRepository.findOne({ where: { user_id: driverId } });
        if (driverData && driverData.scheme_name) {
            schemeType = driverData.scheme_name;
            console.log("truck id", driverData.truck_id);
            const truckData = await this.truckService.getTruck(driverData.truck_id);
            if (truckData && truckData.vehicle_type) {
                truckType = truckData.vehicle_type;
            }
        }
        if (sessions.length) {
            for (let session of sessions) {
                session_ids += session.id + ", ";
                let sessionData = await this.dsRepository.findOneBy({ id: session.id });
                if (sessionData.status) {
                    break;
                }
                if (sessionData.session_end_time) {
                    console.log("step 4");
                    let [items] = await this.driverSessionDistance.findAndCount({ where: { session_id: sessionData.id } });
                    let dis = 0;
                    let tourIdsData = {};
                    for (let item of items) {
                        if (!tourIdsData[item.tour_id]) {
                            tourId_notes += ' ' + item.tour_id;
                            dis = dis + parseFloat(item.distance);
                            console.log("distance ====", item.distance, sessionData.id, item.id);
                            let tr = await this.tourRouteRepo.find({ where: { tour_id: item.tour_id } });
                            let bookingIds = [];
                            for (let t of tr) {
                                if (t.booking_id != 1) {
                                    bookingIds.push(t.booking_id);
                                }
                            }
                            let bookings = await this.bookingRepo.find({ where: { id: (0, typeorm_2.In)(bookingIds) } });
                            for (let booking of bookings) {
                                if (typeof booking.fare != 'string' && booking.fare) {
                                    console.log("typeof booking.fare");
                                    console.log(typeof booking.fare);
                                }
                                console.log("typeof booking.fare");
                                console.log(typeof booking.fare);
                                let customer_company_details = await this.companyRepo.findOne({ where: { users: (0, typeorm_2.Like)((`%#${booking.customer_id},%`)) } });
                                revenue += booking.fare ? parseInt(booking.fare) : 0;
                                revenue += booking.loading_charge ? booking.loading_charge : 0;
                                revenue += booking.toll_charges ? booking.toll_charges : 0;
                                if (customer_company_details && customer_company_details.discount_on_waiting_charges && booking.waiting_charge) {
                                    let waiting_charge = parseInt(booking.waiting_charge);
                                    const dicounted_waiting_charge = waiting_charge - Math.ceil(((customer_company_details.discount_on_waiting_charges / 100) * waiting_charge));
                                    revenue += dicounted_waiting_charge;
                                }
                                else {
                                    revenue += booking.waiting_charge ? parseInt(booking.waiting_charge) : 0;
                                }
                                console.log("revenue ", booking.id, revenue);
                                additional_loading_fare += booking.loading_charge ? booking.loading_charge : 0;
                                additional_toll_fare += booking.toll_charges ? booking.toll_charges : 0;
                            }
                            tourIdsData[item.tour_id] = 1;
                            if (parseFloat(item.distance) <= 4) {
                                no_local_trips += 1;
                            }
                            else {
                                no_long_haul_trips += 1;
                            }
                        }
                    }
                    let start_time = moment(sessionData.session_start_time);
                    let end_time = moment(sessionData.session_end_time);
                    let duration_time = moment.duration(end_time.diff(start_time));
                    let hours = duration_time.asHours();
                    distance += Math.ceil(dis);
                    duration += Math.round(hours * 100) / 100;
                }
            }
            let ratesData = await this.driverRates.findOne({ where: { scheme_name: schemeType, truck_type: truckType } });
            console.log(ratesData);
            console.log(distance);
            console.log({ scheme_name: schemeType, truck_type: truckType });
            if (schemeType == 'scheme1') {
                fareData = await this.calculateSessionFareWithScheme1(ratesData, distance, duration);
            }
            else if (schemeType == 'scheme2') {
                fareData = await this.calculateSessionFareWithScheme2(ratesData, distance, duration);
            }
            else if (schemeType == 'scheme3') {
                fareData = await this.calculateSessionFareWithScheme3(ratesData, distance, duration);
            }
        }
        additional_fare_comments += " additional_loading_fare = " + additional_loading_fare + ", additional_toll_fare = " + additional_toll_fare;
        additional_fare_comments += ", " + tourId_notes;
        const totalDriverPayout = fareData.total_fare + additional_loading_fare + additional_toll_fare;
        let dssData = {
            user_id: driverId,
            driver_name: driverData.name,
            session_date: session_date,
            session_ids: session_ids,
            total_time: Math.ceil(duration),
            total_distance: distance,
            paid: false,
            fare: Math.ceil(totalDriverPayout),
            total_revenue: revenue,
            local_trips: no_local_trips,
            long_haul_trips: no_long_haul_trips,
            notes: fareData.notes + additional_fare_comments
        };
        console.log(dssData);
        await this.dssRepo.delete({ session_date: session_date, user_id: driverId });
        await this.dssRepo.save(dssData);
        const summaryNotes = "session ids " + session_ids + ":" + Math.ceil(duration) + ":" + distance;
        await this.addDriverTransaction(driverData, fareData.total_fare, 'Credit', summaryNotes, '', session_date);
        console.log(fareData.total_fare, 'Credit', summaryNotes, '', session_date);
        return fareData;
    }
    async driverSessionSummary(reqBody) {
        let session_date = reqBody.calc_date;
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'));
        let nextDay = new Date(created_at_date);
        nextDay.setDate(created_at_date.getDate() + 1);
        const whereCond = {
            session_start_time: (0, typeorm_2.Between)(session_date, nextDay),
        };
        let sessions = await this.dsRepository.find({ where: whereCond });
        let driverIds = {};
        let nonClosedDrivers = [];
        console.log("sessions.length");
        console.log(sessions.length);
        if (sessions.length) {
            for (let session of sessions) {
                if (!driverIds[session.user_id]) {
                    driverIds[session.user_id] = [];
                }
                if (session.status == true) {
                    nonClosedDrivers.push(session.user_id);
                }
                driverIds[session.user_id].push(session);
            }
            console.log(Object.keys(driverIds));
            console.log(nonClosedDrivers);
            for (let driverId of Object.keys(driverIds)) {
                if (nonClosedDrivers.indexOf(parseInt(driverId)) < 0) {
                    await this.calculateDriverFareById(parseInt(driverId), session_date);
                }
            }
            return true;
        }
        return false;
    }
    async getDriverSessionSummary(reqBody) {
        let whereCond = {};
        if (reqBody.driver_id) {
            whereCond['user_id'] = reqBody.driver_id;
        }
        if (reqBody.session_date) {
            whereCond['session_date'] = reqBody.session_date;
        }
        const [items, count] = await this.dssRepo.findAndCount({ where: whereCond, order: { created_at: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
    async getDriverSummaryReport(reqBody) {
        let summaryDate = reqBody.calc_date;
        console.log(reqBody);
        let driverRows = '';
        let tRow = `<tr>
                    <td>{{index}}</td>
                    <td>{{id}}</td>
                    <td>{{driverName}}</td>
                    <td>{{payout}}</td>
                    <td>{{revenue}}</td>
                    <td>{{distance}}</td>
                    <td>{{time}}</td>
                    <td>{{ltrips}}</td>
                    <td>{{lhtrips}}</td>
                </tr>`;
        let index = 1;
        let whereCond = {
            session_date: summaryDate
        };
        const driversData = await this.dssRepo.find({ where: whereCond, order: { created_at: 'DESC' } });
        console.log(driversData.length);
        if (driversData && driversData.length) {
            for (let driver of driversData) {
                let driverRow = tRow;
                driverRow = driverRow.replace("{{index}}", index.toString());
                driverRow = driverRow.replace("{{id}}", driver.user_id.toString());
                driverRow = driverRow.replace("{{driverName}}", driver.driver_name);
                driverRow = driverRow.replace("{{payout}}", driver.fare.toString());
                driverRow = driverRow.replace("{{revenue}}", driver.total_revenue.toString());
                driverRow = driverRow.replace("{{distance}}", parseInt(driver.total_distance).toString());
                driverRow = driverRow.replace("{{time}}", driver.total_time.toString());
                driverRow = driverRow.replace("{{ltrips}}", (driver.local_trips ? driver.local_trips : 0).toString());
                driverRow = driverRow.replace("{{lhtrips}}", (driver.long_haul_trips ? driver.long_haul_trips : 0).toString());
                driverRows += driverRow;
                index++;
            }
            const pdfOptions = {
                childProcessOptions: {
                    env: {
                        OPENSSL_CONF: '/dev/null',
                    },
                },
                "format": "A4",
                "orientation": "landscape",
                "border": {
                    "top": "10mm",
                    "bottom": "10mm",
                },
            };
            let data = [];
            var template = './public/dds_new.html';
            var pdf_path = './public/drivers_day_report_' + summaryDate + '.pdf';
            var html = fs.readFileSync(template, 'utf8');
            html = html.replace('{{DRIVERS_DATA}}', driverRows);
            html = html.replace('{{SUMMARY_DATE}}', summaryDate);
            let pdfCreate = (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
                pdf.create(html, pdfOptions).toFile(pdf_path, function (err, res1) {
                    if (err)
                        return;
                    resolve(pdf_path);
                });
            });
            await pdfCreate(html, pdfOptions, pdf_path);
            var mailOptions = {
                from: 'noreplygo.20221@gmail.com',
                to: 'nageswararaonali@gmail.com, prakash@goodmove.in, siva.k.meet@gmail.com , ram@goodmove.in, gitakrishnan@goodmove.in, admin@goodmove.in, abineshwilson123@gmail.com, siva@goodmove.in',
                subject: 'GoodMove (Driver Day Summary Report: ' + summaryDate + '): Thank you for shipping with us!',
                text: `Greetings from GoodMove!!!
    
    Please find attached the report.
        `,
                attachments: [
                    {
                        filename: summaryDate + '.pdf',
                        path: pdf_path
                    }
                ]
            };
            let sendMailFun = (mailOptions) => new Promise((resolve, reject) => {
                mail.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        console.log('Email sent: ' + info.response);
                    }
                    fs.unlinkSync(pdf_path);
                    resolve(info);
                });
            });
            await sendMailFun(mailOptions);
        }
        return true;
    }
    async calculateSessionFareManual() {
        let sessionIds = [];
        sessionIds = [6144,
            6143,
            6142,
            6141,
            6140,
            6139,
            6138,
            6137,
            6136,
            6135,
            6134,
            6133,
            6132,
            6131];
        for (let sessionId of sessionIds) {
            console.log("sessionId", sessionId);
            await this.calculateSessionFare(sessionId);
        }
        return true;
    }
    async getDriverSummaryMetrix(reqBody) {
        let summaryDate = reqBody.calc_date;
        console.log(reqBody);
        let index = 1;
        let whereCond = {
            session_date: (0, typeorm_2.Between)('2025-12-01', '2026-02-28')
        };
        const driversData = await this.dssRepo.find({ where: whereCond, order: { created_at: 'ASC' } });
        let bString = "";
        const reportFileName = './public/driver_summary_metrics.csv';
        const headerData = ['Date', 'Driver Name', 'Total Distance', 'Total Time', 'Revenue', 'Fare'];
        for (let i = 0; i < headerData.length; i++) {
            bString += headerData[i] + ",";
        }
        bString += '\n';
        if (driversData && driversData.length) {
            for (let bkg of driversData) {
                bString += bkg.session_date + "," + bkg.driver_name + "," + bkg.total_distance + "," + bkg.total_time + "," + bkg.total_revenue + "," + bkg.fare + '\n';
                console.log(bString);
            }
            await fs.writeFileSync(reportFileName, bString, 'utf8');
        }
    }
};
DriverService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driver_entity_1.DriversEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(users_entity_1.UsersEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(driverSessions_entity_1.DriverSessionsEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(locations_entity_1.LocationsEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(gmTruckerRates_1.GMTruckerRatesEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(gmTruckerPayments_1.GMTruckerPaymentsEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(tours_entity_1.ToursEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(driverSessionDistance_entity_1.DriverSessionDistanceEntity)),
    __param(8, (0, typeorm_1.InjectRepository)(booking_entity_1.BookingEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(tourRoute_entity_1.TourRouteEntity)),
    __param(10, (0, typeorm_1.InjectRepository)(gmDriverRates_1.GMDriverRatesEntity)),
    __param(11, (0, typeorm_1.InjectRepository)(driverTransactions_1.DriverTransactionsEntity)),
    __param(12, (0, typeorm_1.InjectRepository)(userLogin_entity_1.UserLoginsEntity)),
    __param(13, (0, typeorm_1.InjectRepository)(driverSessionSummary_entity_1.DriverSessionSummaryEntity)),
    __param(14, (0, typeorm_1.InjectRepository)(cusomerCompanyDetails_1.CustomerCompanyEntity)),
    __param(15, (0, typeorm_1.InjectRepository)(driverLastLocDetails_1.DriverLastLocationDetails)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        utils_service_1.UtilsService,
        truck_service_1.TruckService,
        users_service_1.UsersService,
        location_service_1.LocationService,
        config_1.ConfigService])
], DriverService);
exports.DriverService = DriverService;
//# sourceMappingURL=driver.service.js.map