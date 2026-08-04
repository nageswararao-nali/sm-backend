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
exports.DataController = void 0;
const common_1 = require("@nestjs/common");
const data_service_1 = require("../services/data.service");
let DataController = class DataController {
    constructor(dataService) {
        this.dataService = dataService;
    }
    async updateGMRates(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.updateGMRates(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async updateCompanyData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.updateCompanyData(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async feedSpecialAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.feedSpecialAddress(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async updateMultiBookingId(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.updateMultiBookingId(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async cTimeUpdates(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.cTimeUpdates(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async updateBookingTimes(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.updateBookingTimes(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async formBookingData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.formBookingData(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
    async feedCompanyAddressRates(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverData = await this.dataService.feedCompanyAddressRates(reqBody);
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop " + reqBody.mobile_number;
        }
        else {
            response.data = driverData;
        }
        return response;
    }
};
__decorate([
    (0, common_1.Post)('updateGMRates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "updateGMRates", null);
__decorate([
    (0, common_1.Post)('updateCompanyData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "updateCompanyData", null);
__decorate([
    (0, common_1.Post)('feedSpecialAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "feedSpecialAddress", null);
__decorate([
    (0, common_1.Post)('updateMultiBookingId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "updateMultiBookingId", null);
__decorate([
    (0, common_1.Post)('cTimeUpdates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "cTimeUpdates", null);
__decorate([
    (0, common_1.Post)('updateBookingTimes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "updateBookingTimes", null);
__decorate([
    (0, common_1.Post)('formBookingData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "formBookingData", null);
__decorate([
    (0, common_1.Post)('feedCompanyAddressRates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DataController.prototype, "feedCompanyAddressRates", null);
DataController = __decorate([
    (0, common_1.Controller)('data'),
    __metadata("design:paramtypes", [data_service_1.DataService])
], DataController);
exports.DataController = DataController;
//# sourceMappingURL=data.controller.js.map