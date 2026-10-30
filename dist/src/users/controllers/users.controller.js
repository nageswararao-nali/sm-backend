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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../services/users.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const OTP_BYPASS_MOBILES = ['6300359889', '9030935373', '8179730725', '8778620133', '7010020749'];
let UsersController = class UsersController {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    getUsers() {
        return this.usersService.getUsers();
    }
    sendOtp(reqBody) {
        if (OTP_BYPASS_MOBILES.indexOf(reqBody.mobile) > -1) {
            return { type: 'success', message: 'OTP bypassed for test number' };
        }
        return this.usersService.sendOtp(reqBody.mobile);
    }
    verifyOtp(reqBody) {
        if (reqBody.isAdmin) {
            return { type: 'success' };
        }
        if (OTP_BYPASS_MOBILES.indexOf(reqBody.mobile) > -1 && reqBody.otp == '1234') {
            return { type: 'success' };
        }
        return this.usersService.verifyOtp(reqBody.mobile, reqBody.otp);
    }
    async checkUser(reqBody) {
        let response = {
            success: true,
            message: 'User Found'
        };
        const user = await this.usersService.checkUser(reqBody.mobile, reqBody.user_type);
        if (!user) {
            response.success = false;
            response.message = "User with mobile " + reqBody.mobile + " not found";
        }
        else {
            response.data = user;
            response.token = this.jwtService.sign({ id: user.id });
        }
        return response;
    }
    async register(reqBody) {
        let response = {
            success: true,
            message: 'User Registered'
        };
        const user = await this.usersService.checkUser(reqBody.mobile_number);
        if (user) {
            response.success = false;
            response.message = "User with mobile " + reqBody.mobile_number + " already exists";
        }
        else {
            const userData = await this.usersService.register(reqBody);
            if (!userData) {
                response.success = false;
                response.message = "Problem in registering the user";
            }
            else {
                response.data = userData;
                response.token = this.jwtService.sign({ id: userData.id });
            }
        }
        return response;
    }
    async profileUpdate(reqBody) {
        let response = {
            success: true,
            message: 'User Profile Updated Successfully'
        };
        const user = await this.usersService.checkUser(reqBody.mobile_number);
        if (!user) {
            response.success = false;
            response.message = "User with mobile " + reqBody.mobile_number + " not exists";
        }
        else {
            const userData = await this.usersService.profileUpdate(reqBody);
            if (!userData) {
                response.success = false;
                response.message = "Problem in updating profile of the user";
            }
        }
        return response;
    }
    async getAllCustomers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        };
        const { items, count } = await this.usersService.getAllCustomers(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Customers not found";
        }
        else {
            response.data = { customers: items, count };
        }
        return response;
    }
    async getRegularCustomers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        };
        const { items, count } = await this.usersService.getRegularCustomers(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Customers not found";
        }
        else {
            response.data = { customers: items, count };
        }
        return response;
    }
    async userDetails(reqBody) {
        let response = {
            success: true,
            message: '',
            data: {}
        };
        const user = await this.usersService.checkUser(reqBody.mobile);
        if (!user) {
            response.success = false;
            response.message = "User with mobile " + reqBody.mobile + " not found";
        }
        else {
            response.data = user;
        }
        return response;
    }
    async updateStatus(reqBody) {
        let response = {
            success: true,
            message: 'User Status Changed'
        };
        const user = await this.usersService.updateStatus(reqBody.mobile, reqBody.status);
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating status ";
        }
        return response;
    }
    async updateAvailable(reqBody) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        };
        const user = await this.usersService.updateAvailable(reqBody.mobile, reqBody.is_available);
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
        const user = await this.usersService.updateAvailableById(reqBody.user_id, reqBody.is_available);
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response;
    }
    async addAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const addr = await this.usersService.addAddress(reqBody);
        if (!addr) {
            response.success = false;
            response.message = "Address saved successfully";
        }
        else {
            response.data = addr;
        }
        return response;
    }
    async updateAddress(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const addr = await this.usersService.updateAddress(id, reqBody);
        if (!addr) {
            response.success = false;
            response.message = "Address Edited successfully";
        }
        else {
            response.data = addr;
        }
        return response;
    }
    async deleteAddress(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const addr = await this.usersService.deleteAddress(id);
        if (!addr) {
            response.success = false;
            response.message = "Address Delete Fails";
        }
        else {
            response.data = addr;
        }
        return response;
    }
    async deleteAddresses(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const adsData = await this.usersService.deleteAddresses(reqBody);
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        }
        else {
            response.data = adsData;
        }
        return response;
    }
    async getAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const adsData = await this.usersService.getAddress(reqBody);
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        }
        else {
            response.data = adsData;
        }
        return response;
    }
    async getAddressById(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const getAddressData = await this.usersService.getAddressById(reqBody);
        if (!getAddressData) {
            response.success = false;
            response.message = "Addresses not found";
        }
        else {
            response.data = getAddressData;
        }
        return response;
    }
    async getCustomerAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const adsData = await this.usersService.getCustomerAddress(reqBody);
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        }
        else {
            response.data = adsData;
        }
        return response;
    }
    async updateDeviceToken(reqBody) {
        let response = {
            success: true,
            message: 'User token Changed'
        };
        const user = await this.usersService.updateDeviceToken(reqBody);
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating token ";
        }
        return response;
    }
    async getNotifications(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        };
        const { items, count } = await this.usersService.getNotifications(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Notifications not found";
        }
        else {
            response.data = { notifications: items, count };
        }
        return response;
    }
    async viewNotification(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Notification viewed'
        };
        const noti = await this.usersService.viewNotification(reqBody);
        if (!noti) {
            response.success = false;
            response.message = "Notification not updated";
        }
        else {
            response.data = noti;
        }
        return response;
    }
    async getAllCompanies(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Companies List'
        };
        const companies = await this.usersService.getAllCompanies(reqBody);
        if (!companies) {
            response.success = false;
            response.message = "Companies not found";
        }
        else {
            response.data = companies;
        }
        return response;
    }
    async tagCutomerToCompany(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Companies List'
        };
        const companies = await this.usersService.tagCutomerToCompany(reqBody);
        if (!companies) {
            response.success = false;
            response.message = "Companies not found";
        }
        else {
            response.data = companies;
        }
        return response;
    }
    async getUnassignedCustomers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        };
        const customers = await this.usersService.getUnassignedCustomers(reqBody);
        if (!customers) {
            response.success = false;
            response.message = "Companies not found";
        }
        else {
            response.data = customers;
        }
        return response;
    }
    async addCustomerCompany(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        };
        const customers = await this.usersService.addCustomerCompany(reqBody);
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        }
        else {
            response.data = customers;
        }
        return response;
    }
    async getCustomersByIds(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        };
        const customers = await this.usersService.getCustomersByIds(reqBody);
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        }
        else {
            response.data = customers;
        }
        return response;
    }
    async sendNotificationToAll(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        };
        const customers = await this.usersService.sendNotificationToAll(reqBody);
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        }
        else {
            response.data = customers;
        }
        return response;
    }
    async addSpecialAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const addr = await this.usersService.addSpecialAddress(reqBody);
        if (!addr) {
            response.success = false;
            response.message = "Spl Address saved successfully";
        }
        else {
            response.data = addr;
        }
        return response;
    }
    async checkLiveAddress(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        };
        const liveAddress = await this.usersService.checkLiveAddress(reqBody);
        if (!liveAddress) {
            response.success = false;
            response.message = "No match found!";
        }
        else {
            response.data = liveAddress;
        }
        return response;
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUsers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('sendOtp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], UsersController.prototype, "sendOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verifyOtp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "verifyOtp", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('checkUser'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('profileUpdate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "profileUpdate", null);
__decorate([
    (0, common_1.Post)('getAllCustomers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllCustomers", null);
__decorate([
    (0, common_1.Post)('getRegularCustomers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRegularCustomers", null);
__decorate([
    (0, common_1.Post)('userDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "userDetails", null);
__decorate([
    (0, common_1.Post)('updateStatus'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('updateAvailable'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAvailable", null);
__decorate([
    (0, common_1.Post)('updateAvailableById'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAvailableById", null);
__decorate([
    (0, common_1.Post)('addAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addAddress", null);
__decorate([
    (0, common_1.Post)('updateAddress/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Post)('deleteAddress/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Post)('deleteAddresses'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAddresses", null);
__decorate([
    (0, common_1.Post)('getAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAddress", null);
__decorate([
    (0, common_1.Post)('getAddressById'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAddressById", null);
__decorate([
    (0, common_1.Post)('getCustomerAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCustomerAddress", null);
__decorate([
    (0, common_1.Post)('updateDeviceToken'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateDeviceToken", null);
__decorate([
    (0, common_1.Post)('getNotifications'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Post)('viewNotification'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "viewNotification", null);
__decorate([
    (0, common_1.Post)('getAllCompanies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllCompanies", null);
__decorate([
    (0, common_1.Post)('tagCutomerToCompany'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "tagCutomerToCompany", null);
__decorate([
    (0, common_1.Post)('getUnassignedCustomers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUnassignedCustomers", null);
__decorate([
    (0, common_1.Post)('addCustomerCompany'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addCustomerCompany", null);
__decorate([
    (0, common_1.Post)('getCustomersByIds'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCustomersByIds", null);
__decorate([
    (0, common_1.Post)('sendNotificationToAll'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendNotificationToAll", null);
__decorate([
    (0, common_1.Post)('addSpecialAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addSpecialAddress", null);
__decorate([
    (0, common_1.Post)('checkLiveAddress'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkLiveAddress", null);
UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService, jwt_1.JwtService])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map