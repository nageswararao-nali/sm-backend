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
exports.LocationController = void 0;
const common_1 = require("@nestjs/common");
const moment = require("moment");
const utils_service_1 = require("../../utils/services/utils.service");
const locations_entity_1 = require("../models/locations.entity");
const driver_service_1 = require("../services/driver.service");
const location_service_1 = require("../services/location.service");
const haversine = require('haversine');
const DISTANCE_VAR = 0.050;
let LocationController = class LocationController {
    constructor(locService, utilSerive, driverSerive) {
        this.locService = locService;
        this.utilSerive = utilSerive;
        this.driverSerive = driverSerive;
    }
    async getAll() {
        return await this.locService.getAll();
    }
    createLocation(location) {
        this.locService.create(location);
    }
    async addDriverLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        let driverSeeData = {};
        let otherData = {};
        if (reqBody.user_id) {
            const driverLastTrack = await this.driverSerive.updateDriver(reqBody.user_id, { last_tracked_at: new Date() });
            await this.driverSerive.updateDriverLastLocDetails(reqBody);
            if (reqBody.tour_id && !reqBody.session_id) {
                const disData = await this.utilSerive.getTourPickupDistance({ lat: reqBody.latitude, long: reqBody.longitude }, reqBody.sequence_number[0]);
                if (disData && disData.distance < DISTANCE_VAR) {
                    const driverSession = await this.driverSerive.getLatestSession(reqBody.user_id);
                    if (!driverSession) {
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody);
                    }
                    else {
                        driverSeeData = driverSession;
                    }
                    if (driverSession && !driverSession.status) {
                        const nowD = moment(new Date());
                        const startS = moment(driverSession.session_end_time);
                        var duration = moment.duration(nowD.diff(startS));
                        var hours = duration.asHours();
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody);
                    }
                    for (let seqNum of reqBody.sequence_number) {
                        let statusValue = 'Reached';
                        let bstatusValue = 'copleted';
                        await this.utilSerive.updateSeq(seqNum, { status: statusValue });
                        const seqData = await this.utilSerive.getSeq(seqNum);
                        const bsReq = {
                            booking_id: seqData.booking_id,
                            status: 'Reached ' + seqData.transport_type,
                            created_by: 1,
                            trip_id: seqData.trip_id,
                            tour_id: seqData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        await this.locService.addBookingStatus(bsReq);
                        await this.locService.updateBookingTime(seqData.booking_id, bstatusValue + '_' + seqData.transport_type);
                    }
                    const driverToken = await this.utilSerive.getDeviceToken(reqBody.user_id);
                    const TITLE = 'Pick up';
                    const BODY = 'You have reached the pickup location.';
                    if (driverToken) {
                        await this.utilSerive.sendPushNotification(TITLE, BODY, driverToken.split(","));
                    }
                    this.locService.sendCustomerTourNotification(disData);
                    otherData.reached = true;
                }
            }
            else if (reqBody.tour_id && reqBody.session_id) {
                const disData = await this.utilSerive.getTourPickupDistance({ lat: reqBody.latitude, long: reqBody.longitude }, reqBody.sequence_number[0]);
                if (disData && disData.distance < DISTANCE_VAR) {
                    for (let seqNum of reqBody.sequence_number) {
                        let statusValue = 'Reached';
                        let bstatusValue = 'reached';
                        await this.utilSerive.updateSeq(seqNum, { status: statusValue });
                        const seqData = await this.utilSerive.getSeq(seqNum);
                        const bsReq = {
                            booking_id: seqData.booking_id,
                            status: 'Reached ' + seqData.transport_type,
                            created_by: 1,
                            trip_id: seqData.trip_id,
                            tour_id: seqData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        await this.locService.addBookingStatus(bsReq);
                        await this.locService.updateBookingTime(seqData.booking_id, bstatusValue + '_' + seqData.transport_type);
                    }
                    const driverToken = await this.utilSerive.getDeviceToken(reqBody.user_id);
                    const TITLE = disData.transport_type;
                    const BODY = 'You have reached the ' + disData.transport_type + ' location.';
                    if (driverToken) {
                        await this.utilSerive.sendPushNotification(TITLE, BODY, driverToken.split(","));
                    }
                    this.locService.sendCustomerTourNotification(disData);
                }
                const lastPoint = await this.locService.getLatestPoint(reqBody);
                if (lastPoint) {
                    const dData = await this.utilSerive.getDistanceFromGOOSM({ lat: lastPoint.latitude, long: lastPoint.longitude }, { lat: reqBody.latitude, long: reqBody.longitude });
                    if (dData.code == 'Ok') {
                        let distance = dData.routes[0].distance;
                        if (distance) {
                            distance = (distance / 1000);
                            if (distance > 1) {
                                const firstPointTime = moment(lastPoint.loc_time);
                                const secondPointTime = moment(reqBody.loc_time);
                                let dismins = secondPointTime.diff(firstPointTime, 'minutes');
                                if (dismins <= 2) {
                                    let a = { latitude: lastPoint.latitude, longitude: lastPoint.longitude };
                                    let b = { latitude: reqBody.latitude, longitude: reqBody.longitude };
                                    let hdistance = haversine(a, b);
                                    distance = hdistance;
                                }
                            }
                            await this.driverSerive.updateDistance(reqBody.user_id, distance);
                        }
                    }
                }
            }
            const locData = await this.locService.create(reqBody);
            if (!locData) {
                response.success = false;
                response.message = "Problem in saving driver location";
            }
            else {
                response.data = { location: locData, sessionData: driverSeeData, otherData: otherData };
            }
        }
        else {
            response.success = false;
            response.message = 'There is no user id';
        }
        return response;
    }
    async saveDriverLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        let driverSeeData = {};
        let otherData = {};
        if (reqBody.user_id) {
            const driverLastTrack = await this.driverSerive.updateDriver(reqBody.user_id, { last_tracked_at: new Date() });
            await this.driverSerive.updateDriverLastLocDetails(reqBody);
            const locData = await this.locService.create(reqBody);
            if (!locData) {
                response.success = false;
                response.message = "Problem in saving driver location";
            }
            else {
                response.data = { location: locData, sessionData: driverSeeData, otherData: otherData };
            }
        }
        else {
            response.success = false;
            response.message = 'There is no user id';
        }
        return response;
    }
    async updateLatestLocationToBaseLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const results = await this.locService.updateLatestLocationToBaseLocation(reqBody);
        if (!results) {
            response.success = false;
            response.message = "Problem updating latest location";
        }
        else {
            response.data = { results };
        }
        return response;
    }
    async getRange(location) {
        return await this.locService.getRange(location.lat, location.long, location.range);
    }
    async getDriversLocations(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { locs, count } = await this.locService.getDriversLocations(reqBody);
        if (!locs) {
            response.success = false;
            response.message = "Driver Locations not found";
        }
        else {
            response.data = { locations: locs, count };
        }
        return response;
    }
    async getDriverLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const location = await this.locService.getDriverLocation(reqBody);
        if (!location) {
            response.success = false;
            response.message = "Driver Location not found";
        }
        else {
            response.data = location;
        }
        return response;
    }
    async getDriverLocations(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.locService.getDriverLocations(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Driver Locations not found";
        }
        else {
            response.data = { locations: items, count };
        }
        return response;
    }
    async getDriverLocationsByDate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.locService.getDriverLocationsByDate(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Driver Locations not found";
        }
        else {
            response.data = { locations: items, count };
        }
        return response;
    }
    async getDriverLocationsDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const locations = await this.locService.getDriverLocationsDetails(reqBody);
        if (!locations.length) {
            response.success = false;
            response.message = "Driver Locations not found";
        }
        else {
            response.data = { locations: locations };
        }
        return response;
    }
    async sessionReports(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const locations = await this.locService.sessionReports(reqBody);
        if (!locations.length) {
            response.success = false;
            response.message = "Sessions not found";
        }
        else {
            response.data = { locations: locations };
        }
        return response;
    }
    async driverReports(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const locations = await this.locService.driverReports(reqBody);
        if (!locations.length) {
            response.success = false;
            response.message = "Sessions not found";
        }
        else {
            response.data = { locations: locations };
        }
        return response;
    }
    async daySummaryReports(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const summaryReport = await this.locService.daySummaryReports(reqBody);
        if (!summaryReport) {
            response.success = false;
            response.message = "Report not found";
        }
        else {
            response.data = { 'report': summaryReport };
        }
        return response;
    }
    async revenueCalculation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculation(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async waitingChargeNotesUpdatesManual(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.waitingChargeNotesUpdatesManual(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async revenueCalculationNew(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculationNew(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async revenueCalculationManual(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculationManual(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async revenueCalculationDateRange(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculationDateRange(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async showSessionDistances(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.showSessionDistances(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async driverGPSSummary(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.driverGPSSummary(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcWaitingChargeTest(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.caliculateT2WaitingCharge(1335, 1, 12);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverDistanceFromToTimes(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverDistanceFromToTimes(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcOSMTwoPoints(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcOSMTwoPoints(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcOSMMapMatching(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcOSMMapMatching(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async updateBookingTimes(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.updateBookingTimes(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async updateTourStatus(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.updateTourStatus(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverSessionDistanceManual(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverSessionDistanceManual(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async getDistanceFromPoint(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getDistanceFromPoint(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverGoogleDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverGoogleDistance(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverGoogleMapMatchDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverGoogleMapMatchDistance(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async getHomeDeliveryFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getHomeDeliveryFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getHomeDeliveryFareByAddresses(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getHomeDeliveryFareByAddresses(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getDelhiHomeDeliveryFareByAddresses(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getDelhiHomeDeliveryFareByAddresses(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getHomeDeliveryFareByAddressesTest(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getHomeDeliveryFareByAddressesTest(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getBookingFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getBookingFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getMultiBookingFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getMultiBookingFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getLoadingFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getLoadingFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating loading Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async calcDriverGoogleMapMatchDistanceNew(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceNew(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverGoogleMapMatchDistanceWithSpeedTime(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceWithSpeedTime(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcDriverGoogleMapMatchDistanceWithSpeed(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceWithSpeed(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async calcGoogleTourDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcGoogleTourDistance(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async getCustomerCompanyDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.getCustomerCompanyDetails(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async getCustomerAddressEditList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.getCustomerAddressEditList(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async reCalculateHomeDeliveryFareByDate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.reCalculateHomeDeliveryFareByDate(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async checkSourceLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.checkSourceLocation(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async getBookingDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.getBookingDistance(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async calcGoogleMapDistanceWithLatlongs(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.calcGoogleMapDistanceWithLatlongs(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async compareDriverLocationWhenTourUpdate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cDetails = await this.locService.compareDriverLocationWhenTourUpdate(reqBody);
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = cDetails;
        }
        return response;
    }
    async updateMultiBookingFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.updateMultiBookingFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async deliverBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.deliverBooking(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async getDelhiHomeDeliveryFreeFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.getDelhiHomeDeliveryFreeFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async feedCompanyRates(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.feedCompanyRates(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async checkToll(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.checkToll(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async calGenFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calGenFare(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async standaredRevenueCalculationDateRange(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.standaredRevenueCalculationDateRange(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async calcTourDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.calcTourDistance(reqBody.tour_id);
        console.log("tour distance ", revCal);
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        }
        else {
            response.data = revCal;
        }
        return response;
    }
    async compareBookingDistance(reqBody) {
        const response = await this.locService.compareBookingDistance();
        return response;
    }
    async findTourDistancesByTourIds(reqBody) {
        const response = await this.locService.findTourDistancesByTourIds();
        return response;
    }
    async getMetrics(reqBody) {
        const response = await this.locService.getMetrics();
        return response;
    }
    async revenueCalculationDateRangeMetrics(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculationDateRangeMetrics(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
    async revenueCalculationTocompareFaresDateRange(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const revCal = await this.locService.revenueCalculationTocompareFaresDateRange(reqBody);
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        }
        else {
            response.data = { 'report': revCal };
        }
        return response;
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [locations_entity_1.LocationsEntity]),
    __metadata("design:returntype", void 0)
], LocationController.prototype, "createLocation", null);
__decorate([
    (0, common_1.Post)('addDriverLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "addDriverLocation", null);
__decorate([
    (0, common_1.Post)('saveDriverLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "saveDriverLocation", null);
__decorate([
    (0, common_1.Post)('updateLatestLocationToBaseLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateLatestLocationToBaseLocation", null);
__decorate([
    (0, common_1.Post)('range'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getRange", null);
__decorate([
    (0, common_1.Post)('getDriversLocations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDriversLocations", null);
__decorate([
    (0, common_1.Post)('getDriverLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDriverLocation", null);
__decorate([
    (0, common_1.Post)('getDriverLocations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDriverLocations", null);
__decorate([
    (0, common_1.Post)('getDriverLocationsByDate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDriverLocationsByDate", null);
__decorate([
    (0, common_1.Post)('getDriverLocationsDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDriverLocationsDetails", null);
__decorate([
    (0, common_1.Post)('sessionReports'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "sessionReports", null);
__decorate([
    (0, common_1.Post)('driverReports'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "driverReports", null);
__decorate([
    (0, common_1.Post)('daySummaryReports'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "daySummaryReports", null);
__decorate([
    (0, common_1.Post)('revenueCalculation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculation", null);
__decorate([
    (0, common_1.Post)('waitingChargeNotesUpdatesManual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "waitingChargeNotesUpdatesManual", null);
__decorate([
    (0, common_1.Post)('revenueCalculationNew'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculationNew", null);
__decorate([
    (0, common_1.Post)('revenueCalculationManual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculationManual", null);
__decorate([
    (0, common_1.Post)('revenueCalculationDateRange'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculationDateRange", null);
__decorate([
    (0, common_1.Post)('showSessionDistances'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "showSessionDistances", null);
__decorate([
    (0, common_1.Post)('driverGPSSummary'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "driverGPSSummary", null);
__decorate([
    (0, common_1.Post)('calcWaitingChargeTest'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcWaitingChargeTest", null);
__decorate([
    (0, common_1.Post)('calcDriverDistanceFromToTimes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverDistanceFromToTimes", null);
__decorate([
    (0, common_1.Post)('calcOSMTwoPoints'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcOSMTwoPoints", null);
__decorate([
    (0, common_1.Post)('calcOSMMapMatching'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcOSMMapMatching", null);
__decorate([
    (0, common_1.Post)('updateBookingTimes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateBookingTimes", null);
__decorate([
    (0, common_1.Post)('updateTourStatus'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateTourStatus", null);
__decorate([
    (0, common_1.Post)('calcDriverSessionDistanceManual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverSessionDistanceManual", null);
__decorate([
    (0, common_1.Post)('getDistanceFromPoint'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDistanceFromPoint", null);
__decorate([
    (0, common_1.Post)('calcDriverGoogleDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverGoogleDistance", null);
__decorate([
    (0, common_1.Post)('calcDriverGoogleMapMatchDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverGoogleMapMatchDistance", null);
__decorate([
    (0, common_1.Post)('getHomeDeliveryFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getHomeDeliveryFare", null);
__decorate([
    (0, common_1.Post)('getHomeDeliveryFareByAddresses'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getHomeDeliveryFareByAddresses", null);
__decorate([
    (0, common_1.Post)('getDelhiHomeDeliveryFareByAddresses'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDelhiHomeDeliveryFareByAddresses", null);
__decorate([
    (0, common_1.Post)('getHomeDeliveryFareByAddressesTest'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getHomeDeliveryFareByAddressesTest", null);
__decorate([
    (0, common_1.Post)('getBookingFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getBookingFare", null);
__decorate([
    (0, common_1.Post)('getMultiBookingFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getMultiBookingFare", null);
__decorate([
    (0, common_1.Post)('getLoadingFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getLoadingFare", null);
__decorate([
    (0, common_1.Post)('calcDriverGoogleMapMatchDistanceNew'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverGoogleMapMatchDistanceNew", null);
__decorate([
    (0, common_1.Post)('calcDriverGoogleMapMatchDistanceWithSpeedTime'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverGoogleMapMatchDistanceWithSpeedTime", null);
__decorate([
    (0, common_1.Post)('calcDriverGoogleMapMatchDistanceWithSpeed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcDriverGoogleMapMatchDistanceWithSpeed", null);
__decorate([
    (0, common_1.Post)('calcGoogleTourDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcGoogleTourDistance", null);
__decorate([
    (0, common_1.Post)('getCustomerCompanyDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getCustomerCompanyDetails", null);
__decorate([
    (0, common_1.Post)('getCustomerAddressEditList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getCustomerAddressEditList", null);
__decorate([
    (0, common_1.Post)('reCalculateHomeDeliveryFareByDate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "reCalculateHomeDeliveryFareByDate", null);
__decorate([
    (0, common_1.Post)('checkSourceLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "checkSourceLocation", null);
__decorate([
    (0, common_1.Post)('getBookingDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getBookingDistance", null);
__decorate([
    (0, common_1.Post)('calcGoogleMapDistanceWithLatlongs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcGoogleMapDistanceWithLatlongs", null);
__decorate([
    (0, common_1.Post)('compareDriverLocationWhenTourUpdate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "compareDriverLocationWhenTourUpdate", null);
__decorate([
    (0, common_1.Post)('updateMultiBookingFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "updateMultiBookingFare", null);
__decorate([
    (0, common_1.Post)('deliverBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "deliverBooking", null);
__decorate([
    (0, common_1.Post)('getDelhiHomeDeliveryFreeFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getDelhiHomeDeliveryFreeFare", null);
__decorate([
    (0, common_1.Post)('feedCompanyRates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "feedCompanyRates", null);
__decorate([
    (0, common_1.Post)('checkToll'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "checkToll", null);
__decorate([
    (0, common_1.Post)('calGenFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calGenFare", null);
__decorate([
    (0, common_1.Post)('standaredRevenueCalculationDateRange'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "standaredRevenueCalculationDateRange", null);
__decorate([
    (0, common_1.Post)('calcTourDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "calcTourDistance", null);
__decorate([
    (0, common_1.Post)('compareBookingDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "compareBookingDistance", null);
__decorate([
    (0, common_1.Post)('findTourDistancesByTourIds'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "findTourDistancesByTourIds", null);
__decorate([
    (0, common_1.Post)('getMetrics'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)('revenueCalculationDateRangeMetrics'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculationDateRangeMetrics", null);
__decorate([
    (0, common_1.Post)('revenueCalculationTocompareFaresDateRange'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LocationController.prototype, "revenueCalculationTocompareFaresDateRange", null);
LocationController = __decorate([
    (0, common_1.Controller)('location'),
    __metadata("design:paramtypes", [location_service_1.LocationService,
        utils_service_1.UtilsService,
        driver_service_1.DriverService])
], LocationController);
exports.LocationController = LocationController;
//# sourceMappingURL=location.controller.js.map