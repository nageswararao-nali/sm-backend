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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const admin_service_1 = require("../services/admin.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async addConsolidationCenter(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const userDetails = await this.adminService.addConsolidationCenter(reqBody);
        if (!userDetails) {
            response.success = false;
            response.message = "Problem in creating Consolidation";
        }
        else {
            response.data = userDetails;
        }
        return response;
    }
    async getConsolidationCenters(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.adminService.getConsolidationCenters(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Consolidation Centers not found";
        }
        else {
            response.data = { consolidationCenters: items, count };
        }
        return response;
    }
    async getCategories(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const catData = await this.adminService.getCategories(reqBody);
        if (!catData) {
            response.success = false;
            response.message = "Categories not found";
        }
        else {
            response.data = catData;
        }
        return response;
    }
    async sendNotification(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        };
        await this.adminService.sendPushNotification("Test", "Test notification", [reqBody.token]);
        return response;
    }
    async sendSingleInvoice(file) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        };
        await this.adminService.sendSingleInvoice(file.path);
        return response;
    }
    async sendBulkInvoice(file) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        };
        await this.adminService.sendBulkInvoice(file.path);
        return response;
    }
    async sendFlipkartBulkInvoice(file) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        };
        await this.adminService.sendFlipkartBulkInvoice(file.path);
        return response;
    }
    async sendCustomerNotifications(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        };
        await this.adminService.sendCustomerNotifications();
        return response;
    }
    async addBaseLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const userDetails = await this.adminService.addBaseLocation(reqBody);
        if (!userDetails.id) {
            response.success = false;
            response.message = userDetails.message;
        }
        else {
            response.data = userDetails;
        }
        return response;
    }
    async getBaseLocations(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.adminService.getBaseLocations(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Base Locations not found";
        }
        else {
            response.data = { baseLocations: items, count };
        }
        return response;
    }
    async editBaseLocation(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const userDetails = await this.adminService.editBaseLocation(reqBody);
        if (!userDetails) {
            response.success = false;
            response.message = "Problem in editing BaseLocation";
        }
        else {
            response.data = userDetails;
        }
        return response;
    }
    async sendNotificationToUsers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        };
        await this.adminService.sendNotificationToUsers(reqBody);
        return response;
    }
    async sendNotificationToAll(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        };
        await this.adminService.sendNotificationToAll(reqBody);
        return response;
    }
    async getPortalSettings(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.adminService.getPortalSettings(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Portal Settings not found";
        }
        else {
            response.data = { portalSettings: items, count };
        }
        return response;
    }
    async addPortalSetting(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const settingData = await this.adminService.addPortalSetting(reqBody);
        if (!settingData.id) {
            response.success = false;
            response.message = settingData.message;
        }
        else {
            response.data = settingData;
        }
        return response;
    }
    async editPortalSetting(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const settingData = await this.adminService.editPortalSetting(reqBody);
        if (!settingData) {
            response.success = false;
            response.message = "Problem in editing Portal Setting";
        }
        else {
            response.data = settingData;
        }
        return response;
    }
    async bookDemo(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        if (!reqBody.name || !reqBody.mobile || !reqBody.email) {
            response.success = false;
            response.message = "Name, mobile and email are required";
            return response;
        }
        const sent = await this.adminService.bookDemo(reqBody);
        if (!sent) {
            response.success = false;
            response.message = "Problem in sending demo request";
        }
        else {
            response.message = "Demo request sent";
        }
        return response;
    }
};
__decorate([
    (0, common_1.Post)('addConsolidationCenter'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addConsolidationCenter", null);
__decorate([
    (0, common_1.Post)('getConsolidationCenters'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getConsolidationCenters", null);
__decorate([
    (0, common_1.Post)('getCategories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('sendNotification'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('invoice'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendSingleInvoice", null);
__decorate([
    (0, common_1.Post)('bulk-invoice'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendBulkInvoice", null);
__decorate([
    (0, common_1.Post)('flp-bulk-invoice'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendFlipkartBulkInvoice", null);
__decorate([
    (0, common_1.Post)('sendCustomerNotifications'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendCustomerNotifications", null);
__decorate([
    (0, common_1.Post)('addBaseLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addBaseLocation", null);
__decorate([
    (0, common_1.Post)('getBaseLocations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBaseLocations", null);
__decorate([
    (0, common_1.Post)('editBaseLocation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "editBaseLocation", null);
__decorate([
    (0, common_1.Post)('sendNotificationToUsers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotificationToUsers", null);
__decorate([
    (0, common_1.Post)('sendNotificationToAll'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotificationToAll", null);
__decorate([
    (0, common_1.Post)('getPortalSettings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPortalSettings", null);
__decorate([
    (0, common_1.Post)('addPortalSetting'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "addPortalSetting", null);
__decorate([
    (0, common_1.Post)('editPortalSetting'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "editPortalSetting", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('bookDemo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "bookDemo", null);
AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map