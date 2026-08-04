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
exports.DriverController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const users_service_1 = require("../../users/services/users.service");
const driver_service_1 = require("../services/driver.service");
const truck_service_1 = require("../services/truck.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let DriverController = class DriverController {
    constructor(driverService, usersService, truckService) {
        this.driverService = driverService;
        this.usersService = usersService;
        this.truckService = truckService;
    }
    async addDriver(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const user = await this.usersService.checkUser(reqBody.mobile_number);
        const driver = await this.driverService.getDriver({ mobile_number: reqBody.mobile_number });
        if (driver || (user && user.user_type == 'Driver')) {
            response.success = false;
            response.message = "Driver with " + reqBody.mobile_number + " already exists";
            return response;
        }
        else {
            if (user && user.user_type != 'Driver') {
                reqBody['user_id'] = user.id;
            }
            else {
                reqBody['user_type'] = 'Driver';
                const userData = await this.usersService.addUser(reqBody);
                reqBody['user_id'] = userData.id;
            }
            const driverData = await this.driverService.addDriver(reqBody);
            if (!driverData) {
                response.success = false;
                response.message = "Problem in saving driver " + reqBody.mobile_number;
            }
            else {
                response.data = driverData;
            }
            return response;
        }
    }
    async addOwner(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const user = await this.usersService.checkUser(reqBody.mobile_number);
        if (user) {
            response.success = false;
            response.message = "Owner with " + reqBody.mobile_number + " already exists";
            return response;
        }
        else {
            reqBody['user_type'] = 'Owner';
            const userData = await this.usersService.addUser(reqBody);
            if (!userData) {
                response.success = false;
                response.message = "Problem in saving owner " + reqBody.mobile_number;
            }
            else {
                response.data = userData;
            }
            return response;
        }
    }
    async updateOwner(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        reqBody['user_type'] = 'Owner';
        const userData = await this.usersService.updateOwner(id, reqBody);
        if (!userData) {
            response.success = false;
            response.message = "Problem in updating owner " + reqBody.mobile_number;
        }
        else {
            response.data = userData;
        }
        return response;
    }
    async deleteOwner(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const userData = await this.usersService.deleteOwner(id);
        const driverData = await this.driverService.deleteByOwner(id);
        const truckData = await this.truckService.deleteByOwner(id);
        if (!userData) {
            response.success = false;
            response.message = "Problem in updating owner " + id;
        }
        else {
            response.data = userData;
        }
        return response;
    }
    async getOwners(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.usersService.getUsersByType(reqBody, 'Owner');
        if (!items) {
            response.success = false;
            response.message = "Owners not found";
        }
        else {
            response.data = { owners: items, count };
        }
        return response;
    }
    async getDriver(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverDetails = await this.driverService.getDriver(reqBody);
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = driverDetails;
        }
        return response;
    }
    async getOwner(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const userDetails = await this.usersService.checkUser(reqBody.mobile_number);
        if (!userDetails) {
            response.success = false;
            response.message = "Owner not found";
        }
        else {
            response.data = userDetails;
        }
        return response;
    }
    async updateDriver(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverDetails = await this.driverService.updateDriver(id, reqBody);
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = driverDetails;
        }
        return response;
    }
    async deleteDriver(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverDetails = await this.driverService.deleteDriver(id);
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = driverDetails;
        }
        return response;
    }
    async getDrivers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { drivers, count } = await this.driverService.getDrivers(reqBody);
        if (!drivers) {
            response.success = false;
            response.message = "Drivers not found";
        }
        else {
            response.data = { drivers: drivers, count };
        }
        return response;
    }
    async driverDetails(reqBody) {
        let response = {
            success: true,
            message: '',
            data: {}
        };
        const user = await this.driverService.driverDetails(reqBody.mobile);
        if (!user) {
            response.success = false;
            response.message = "User with mobile " + reqBody.mobile + " not found";
        }
        else {
            response.data = user;
        }
        return response;
    }
    async getDriverSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverSession = await this.driverService.getLatestSession(reqBody.user_id);
        if (!driverSession) {
            response.success = false;
            response.message = "Driver Session not found";
        }
        else {
            response.data = driverSession;
        }
        return response;
    }
    async updateDriverSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverSession = await this.driverService.updateDriverSession(reqBody.user_id);
        if (!driverSession) {
            response.success = false;
            response.message = "Driver Session not found";
        }
        else {
            response.data = driverSession;
        }
        return response;
    }
    async getDriverSessions(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { sessions, count } = await this.driverService.getLatestSessions(reqBody);
        if (!sessions) {
            response.success = false;
            response.message = "Driver Sessions not found";
        }
        else {
            response.data = { sessionList: sessions, count };
        }
        return response;
    }
    async getAllSessions(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const sessions = await this.driverService.getAllSessions(reqBody);
        if (!sessions) {
            response.success = false;
            response.message = "Driver Sessions not found";
        }
        else {
            response.data = { sessionList: sessions };
        }
        return response;
    }
    async createSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const sessionDetails = await this.driverService.createSessionByManager({ id: reqBody.start_location }, reqBody);
        if (!sessionDetails) {
            response.success = false;
            response.message = "Session not found";
        }
        else {
            response.data = sessionDetails;
        }
        return response;
    }
    async updateSession(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const sessionDetails = await this.driverService.updateSession(id, reqBody);
        if (!sessionDetails) {
            response.success = false;
            response.message = "Session not found";
        }
        else {
            response.data = sessionDetails;
        }
        return response;
    }
    async deleteSession(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverDetails = await this.driverService.deleteSession(id);
        if (!driverDetails) {
            response.success = false;
            response.message = "Session not found";
        }
        else {
            response.data = driverDetails;
        }
        return response;
    }
    async addTruckerRate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckerRateDetails = await this.driverService.addTruckerRate(reqBody);
        if (!truckerRateDetails) {
            response.success = false;
            response.message = "Trucker Rate not saved!";
        }
        else {
            response.data = truckerRateDetails;
        }
        return response;
    }
    async updateTruckerRate(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckerRateDetails = await this.driverService.updateTruckerRate(id, reqBody);
        if (!truckerRateDetails) {
            response.success = false;
            response.message = "Trucker Rate not found";
        }
        else {
            response.data = truckerRateDetails;
        }
        return response;
    }
    async truckersRateList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckerRates = await this.driverService.truckersRateList(reqBody);
        if (!truckerRates) {
            response.success = false;
            response.message = "Trucker Rates not found";
        }
        else {
            response.data = { truckerRates: truckerRates };
        }
        return response;
    }
    async driverPaymentCalculation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckerRates = await this.driverService.driverPaymentCalculation(reqBody);
        if (!truckerRates) {
            response.success = false;
            response.message = "Trucker Payment not added";
        }
        else {
            response.data = { truckerRates: truckerRates };
        }
        return response;
    }
    async sendInactiveNotification(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const notificationData = await this.driverService.sendInactiveNotification(reqBody);
        if (!notificationData) {
            response.success = false;
            response.message = "Problem in sending notification";
        }
        else {
            response.data = { notificationData: notificationData };
        }
        return response;
    }
    async updateAvailable(reqBody) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        };
        const user = await this.driverService.updateAvailable(reqBody.mobile, reqBody.is_available);
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response;
    }
    async updateAvailableById(reqBody) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        };
        const user = await this.driverService.updateAvailableById(reqBody.user_id, reqBody.is_available);
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response;
    }
    async calculateSessionFare(reqBody) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        };
        const user = await this.driverService.calculateSessionFare(reqBody.session_id);
        if (!user) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response;
    }
    async updateSessionFare(reqBody) {
        let response = {
            success: true,
            message: 'Session Fare Updated'
        };
        const updFare = await this.driverService.updateSessionFare(reqBody.session_id);
        if (!updFare) {
            response.success = false;
            response.message = "Problem in updating Session Fare";
        }
        return response;
    }
    async payDriverFare(file) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        };
        console.log(file);
        await this.driverService.payDriverFare(file);
        return response;
    }
    async getDriverTransactions(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const { items, count } = await this.driverService.getDriverTransactions(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver transactions";
        }
        else {
            response.data = { transactions: items, count };
        }
        return response;
    }
    async getDriverCumulativeEarnings(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'getting driver Fare'
        };
        const cFare = await this.driverService.getDriverCumulativeEarnings(reqBody);
        if (!cFare) {
            response.success = false;
            response.message = "Problem in getting driver total earnings of current month";
        }
        else {
            response.data = { cumulativeEarning: cFare };
        }
        return response;
    }
    async autoSessionClose(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const updateSes = await this.driverService.autoSessionClose();
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async driverMonthlyFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Driver Monthly Fare Updated'
        };
        const updateSes = await this.driverService.driverMonthlyFare();
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async driverSessionSummary(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const updateSes = await this.driverService.driverSessionSummary(reqBody);
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async calculateSessionFareManual(reqBody) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        };
        const user = await this.driverService.calculateSessionFareManual();
        if (!user) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response;
    }
    async getDriverSessionSummary(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const { items, count } = await this.driverService.getDriverSessionSummary(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver sesstion summary";
        }
        else {
            response.data = { summary: items, count };
        }
        return response;
    }
    async calculateDriverFareById(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const { items, count } = await this.driverService.calculateDriverFareById(reqBody.driver_id, reqBody.calc_date);
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver sesstion summary";
        }
        else {
            response.data = { summary: items, count };
        }
        return response;
    }
    async getDriverSummaryReport(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const updateSes = await this.driverService.getDriverSummaryReport(reqBody);
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in sending driver summary report";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async getDriverSummaryMetrix(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.driverService.getDriverSummaryMetrix(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = driverData;
        }
        return response;
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('addDriver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "addDriver", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('addOwner'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "addOwner", null);
__decorate([
    (0, common_1.Post)('updateOwner/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateOwner", null);
__decorate([
    (0, common_1.Post)('deleteOwner/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "deleteOwner", null);
__decorate([
    (0, common_1.Post)('getOwners'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getOwners", null);
__decorate([
    (0, common_1.Post)('getDriver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriver", null);
__decorate([
    (0, common_1.Post)('getOwner'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getOwner", null);
__decorate([
    (0, common_1.Post)('updateDriver/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateDriver", null);
__decorate([
    (0, common_1.Post)('deleteDriver/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "deleteDriver", null);
__decorate([
    (0, common_1.Post)('getDrivers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDrivers", null);
__decorate([
    (0, common_1.Post)('driverDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "driverDetails", null);
__decorate([
    (0, common_1.Post)('getDriverSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverSession", null);
__decorate([
    (0, common_1.Post)('updateDriverSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateDriverSession", null);
__decorate([
    (0, common_1.Post)('getDriverSessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverSessions", null);
__decorate([
    (0, common_1.Post)('getAllSessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getAllSessions", null);
__decorate([
    (0, common_1.Post)('createSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "createSession", null);
__decorate([
    (0, common_1.Post)('updateSession/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Post)('deleteSession/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('addTruckerRate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "addTruckerRate", null);
__decorate([
    (0, common_1.Post)('updateTruckerRate/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateTruckerRate", null);
__decorate([
    (0, common_1.Post)('truckersRateList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "truckersRateList", null);
__decorate([
    (0, common_1.Post)('driverPaymentCalculation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "driverPaymentCalculation", null);
__decorate([
    (0, common_1.Post)('sendInactiveNotification'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "sendInactiveNotification", null);
__decorate([
    (0, common_1.Post)('updateAvailable'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateAvailable", null);
__decorate([
    (0, common_1.Post)('updateAvailableById'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateAvailableById", null);
__decorate([
    (0, common_1.Post)('calculateSessionFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "calculateSessionFare", null);
__decorate([
    (0, common_1.Post)('updateSessionFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "updateSessionFare", null);
__decorate([
    (0, common_1.Post)('payDriverFare'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "payDriverFare", null);
__decorate([
    (0, common_1.Post)('getDriverTransactions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverTransactions", null);
__decorate([
    (0, common_1.Post)('getDriverCumulativeEarnings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverCumulativeEarnings", null);
__decorate([
    (0, common_1.Post)('autoSessionClose'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "autoSessionClose", null);
__decorate([
    (0, common_1.Post)('driverMonthlyFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "driverMonthlyFare", null);
__decorate([
    (0, common_1.Post)('driverSessionSummary'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "driverSessionSummary", null);
__decorate([
    (0, common_1.Post)('calculateSessionFareManual'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "calculateSessionFareManual", null);
__decorate([
    (0, common_1.Post)('getDriverSessionSummary'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverSessionSummary", null);
__decorate([
    (0, common_1.Post)('calculateDriverFareById'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "calculateDriverFareById", null);
__decorate([
    (0, common_1.Post)('getDriverSummaryReport'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverSummaryReport", null);
__decorate([
    (0, common_1.Post)('getDriverSummaryMetrix'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getDriverSummaryMetrix", null);
DriverController = __decorate([
    (0, common_1.Controller)('driver'),
    __metadata("design:paramtypes", [driver_service_1.DriverService,
        users_service_1.UsersService,
        truck_service_1.TruckService])
], DriverController);
exports.DriverController = DriverController;
//# sourceMappingURL=driver.controller.js.map