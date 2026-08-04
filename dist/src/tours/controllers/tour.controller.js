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
exports.TourController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const tour_service_1 = require("../services/tour.service");
let TourController = class TourController {
    constructor(tourService) {
        this.tourService = tourService;
    }
    async tourDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.tourDetails(reqBody.tourId);
        if (!tour) {
            response.success = false;
            response.message = "Tour with id " + reqBody.tourId + " not found";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async tourFullDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.tourFullDetails(reqBody.tourId);
        if (!tour) {
            response.success = false;
            response.message = "Tour with id " + reqBody.tourId + " not found";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async toursList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.toursList(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async assignTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.acceptTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour with id " + reqBody.tourId + " not found";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async startTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.startTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour with id " + reqBody.tourId + " not found";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async uploadOdometer(reqBody, file) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const odometerUpload = await this.tourService.uploadOdometer(file, reqBody.tour_id);
        if (!odometerUpload) {
            response.success = false;
            response.message = "Odometer with tour id " + reqBody.tour_id + " not found";
        }
        else {
            response.data = odometerUpload;
        }
        return response;
    }
    async tourDocuments(reqBody, file) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const odometerUpload = await this.tourService.tourDocuments(file, reqBody.tour_id);
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id " + reqBody.tour_id + " not found";
        }
        else {
            response.data = odometerUpload;
        }
        return response;
    }
    async sendTourOtp(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const odometerUpload = await this.tourService.sendTourOtp(reqBody.mobile);
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id " + reqBody.tour_id + " not found";
        }
        else {
            response.data = { message: 'OTP sent successfully' };
        }
        return response;
    }
    async verifyTourOtp(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const odometerUpload = await this.tourService.verifyTourOtp(reqBody.mobile, reqBody.otp);
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id " + reqBody.tour_id + " not found";
        }
        else {
            response.data = { message: 'OTP Verified Successfully' };
        }
        return response;
    }
    async truckerTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.truckerTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours not found with trucker id " + reqBody.truck_owner_id;
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async rejectTour(reqBody) {
        const res = await this.tourService.rejectTour(reqBody);
        return res;
    }
    async addTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.addTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour saved successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async updateTourDriver(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.updateTourDriver(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Problem in updating Tour Driver";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async sendDeliveryOtp(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.updateTourDriver(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Problem in sending Delivery Otp";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async completeTourRoute(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.completeTourRoute(reqBody.seq);
        if (!tour) {
            response.success = false;
            response.message = "Problem in completing tour";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async updateSequence(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.updateSequence(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async updatePaySequence(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.updatePaySequence(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async completeTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.completeTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour completed successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async tourInfo(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.tourInfo(reqBody.tourId);
        if (!tour) {
            response.success = false;
            response.message = "Tour with id " + reqBody.tourId + " not found";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async deleteSession(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tourDetails = await this.tourService.deleteTour(id);
        if (!tourDetails) {
            response.success = false;
            response.message = "Tour not found";
        }
        else {
            response.data = tourDetails;
        }
        return response;
    }
    async updateTourTrips(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.updateTourTrips(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Problem in updating Tour Trips";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async addClosedTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.addClosedTour(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour saved successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async callToCustomer(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.callToCustomer(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async callToDriver(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.callToDriver(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async testExotel(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.testExotel(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async testExotelByNumbers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.testExotelByNumbers(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async updateBookingTime(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.tourService.updateBookingTime(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getTourDistance(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.tourService.getTourDistance(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async callDriverWhenTourEdit(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        };
        const bookingData = await this.tourService.callDriverWhenTourEdit(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async tourDetailsData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        };
        const bookingData = await this.tourService.tourDetailsData(reqBody.tourId);
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async notificationToCustomerAboutDriverWaiting(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        };
        const bookingData = await this.tourService.notificationToCustomerAboutDriverWaiting();
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async driverToursList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.driverToursList(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async driverBookingsList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.driverBookingsList(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async checkDelayTours(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.checkDelayTours(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async test(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.test(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async checkTourSessionTagging(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const updateSes = await this.tourService.checkTourSessionTagging(reqBody);
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in checking driver session tour tagging";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async cleanDoubleTagged(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        };
        const updateSes = await this.tourService.cleanDoubleTagged(reqBody);
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in checking driver session tour tagging";
        }
        else {
            response.data = updateSes;
        }
        return response;
    }
    async uploadDeliveryProof(reqBody, file) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const proof = await this.tourService.uploadDeliveryProof(file, Number(reqBody.seq_num), reqBody.lat ? Number(reqBody.lat) : undefined, reqBody.lng ? Number(reqBody.lng) : undefined);
        if (!proof) {
            response.success = false;
            response.message = 'Failed to upload delivery proof';
        }
        else {
            response.data = proof;
        }
        return response;
    }
    async vehicleLiveDataList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const vhecleList = await this.tourService.vehicleLiveDataList(reqBody);
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        }
        else {
            response.data = vhecleList;
        }
        return response;
    }
    async estimateLiveVehicleData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const vhecleList = await this.tourService.estimateLiveVehicleData(reqBody);
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        }
        else {
            response.data = vhecleList;
        }
        return response;
    }
    async getEstimatedLiveVehicleData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const vhecleList = await this.tourService.getEstimatedLiveVehicleData(reqBody);
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        }
        else {
            response.data = vhecleList;
        }
        return response;
    }
    async simulateVehicleLiveDataList(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const vhecleList = await this.tourService.simulateVehicleLiveDataList(reqBody);
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        }
        else {
            response.data = vhecleList;
        }
        return response;
    }
    async initiateReturn(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.initiateReturn(reqBody);
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        }
        else {
            response.data = tour;
        }
        return response;
    }
    async getDriverToursByDate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tours = await this.tourService.getDriverToursByDate(reqBody);
        if (!tours && tours.length) {
            response.success = false;
            response.message = "Tours not found";
        }
        else {
            response.data = tours;
        }
        return response;
    }
    async checkActiveTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tour = await this.tourService.checkActiveTour(reqBody.driver_id);
        if (!tour) {
            response.success = false;
            response.message = "Tour Save has issue!";
        }
        else {
            response.data = tour;
        }
        return response;
    }
};
__decorate([
    (0, common_1.Post)('tourDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "tourDetails", null);
__decorate([
    (0, common_1.Post)('tourFullDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "tourFullDetails", null);
__decorate([
    (0, common_1.Post)('toursList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "toursList", null);
__decorate([
    (0, common_1.Post)('assignTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "assignTour", null);
__decorate([
    (0, common_1.Post)('startTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "startTour", null);
__decorate([
    (0, common_1.Post)('uploadOdometer'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "uploadOdometer", null);
__decorate([
    (0, common_1.Post)('tourDocuments'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "tourDocuments", null);
__decorate([
    (0, common_1.Post)('sendTourOtp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "sendTourOtp", null);
__decorate([
    (0, common_1.Post)('verifyTourOtp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "verifyTourOtp", null);
__decorate([
    (0, common_1.Post)('truckerTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "truckerTour", null);
__decorate([
    (0, common_1.Post)('rejectTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "rejectTour", null);
__decorate([
    (0, common_1.Post)('addTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "addTour", null);
__decorate([
    (0, common_1.Post)('updateTourDriver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "updateTourDriver", null);
__decorate([
    (0, common_1.Post)('sendDeliveryOtp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "sendDeliveryOtp", null);
__decorate([
    (0, common_1.Post)('completeTourRoute'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "completeTourRoute", null);
__decorate([
    (0, common_1.Post)('updateSequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "updateSequence", null);
__decorate([
    (0, common_1.Post)('updatePaySequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "updatePaySequence", null);
__decorate([
    (0, common_1.Post)('completeTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "completeTour", null);
__decorate([
    (0, common_1.Post)('tourInfo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "tourInfo", null);
__decorate([
    (0, common_1.Post)('deleteTour/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('updateTourTrips'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "updateTourTrips", null);
__decorate([
    (0, common_1.Post)('addClosedTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "addClosedTour", null);
__decorate([
    (0, common_1.Post)('callToCustomer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "callToCustomer", null);
__decorate([
    (0, common_1.Post)('callToDriver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "callToDriver", null);
__decorate([
    (0, common_1.Post)('testExotel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "testExotel", null);
__decorate([
    (0, common_1.Post)('testExotelByNumbers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "testExotelByNumbers", null);
__decorate([
    (0, common_1.Post)('updateBookingTime'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "updateBookingTime", null);
__decorate([
    (0, common_1.Post)('getTourDistance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "getTourDistance", null);
__decorate([
    (0, common_1.Post)('callDriverWhenTourEdit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "callDriverWhenTourEdit", null);
__decorate([
    (0, common_1.Post)('tourDetailsData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "tourDetailsData", null);
__decorate([
    (0, common_1.Post)('notificationToCustomerAboutDriverWaiting'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "notificationToCustomerAboutDriverWaiting", null);
__decorate([
    (0, common_1.Post)('driverToursList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "driverToursList", null);
__decorate([
    (0, common_1.Post)('driverBookingsList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "driverBookingsList", null);
__decorate([
    (0, common_1.Post)('checkDelayTours'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "checkDelayTours", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "test", null);
__decorate([
    (0, common_1.Post)('checkTourSessionTagging'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "checkTourSessionTagging", null);
__decorate([
    (0, common_1.Post)('cleanDoubleTagged'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "cleanDoubleTagged", null);
__decorate([
    (0, common_1.Post)('uploadDeliveryProof'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('proof_image')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "uploadDeliveryProof", null);
__decorate([
    (0, common_1.Post)('vehicleLiveDataList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "vehicleLiveDataList", null);
__decorate([
    (0, common_1.Post)('estimateLiveVehicleData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "estimateLiveVehicleData", null);
__decorate([
    (0, common_1.Post)('getEstimatedLiveVehicleData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "getEstimatedLiveVehicleData", null);
__decorate([
    (0, common_1.Post)('simulateVehicleLiveDataList'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "simulateVehicleLiveDataList", null);
__decorate([
    (0, common_1.Post)('initiateReturn'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "initiateReturn", null);
__decorate([
    (0, common_1.Post)('getDriverToursByDate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "getDriverToursByDate", null);
__decorate([
    (0, common_1.Post)('checkActiveTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TourController.prototype, "checkActiveTour", null);
TourController = __decorate([
    (0, common_1.Controller)('tours'),
    __metadata("design:paramtypes", [tour_service_1.TourService])
], TourController);
exports.TourController = TourController;
//# sourceMappingURL=tour.controller.js.map