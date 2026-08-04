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
exports.TruckController = void 0;
const common_1 = require("@nestjs/common");
const truck_service_1 = require("../services/truck.service");
let TruckController = class TruckController {
    constructor(truckService) {
        this.truckService = truckService;
    }
    async getTruckDetails(truckId) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.getTruck(truckId);
        if (!truckDetails) {
            response.success = false;
            response.message = "Truck with " + truckId + " not found";
        }
        else {
            response.data = truckDetails;
        }
        return response;
    }
    async getTruck(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.getTruck(reqBody.truckId);
        if (!truckDetails) {
            response.success = false;
            response.message = "Truck with " + reqBody.truckId + " not found";
        }
        else {
            response.data = truckDetails;
        }
        return response;
    }
    async addSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const session = await this.truckService.addDriverSession(reqBody);
        if (!session) {
            response.success = false;
            response.message = "Session with driver " + reqBody.driver_id + " already in active";
        }
        else {
            response.data = session;
        }
        return response;
    }
    async getSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const session = await this.truckService.getDriverSession(reqBody);
        if (!session) {
            response.success = false;
            response.message = "No active Session for driver " + reqBody.driver_id;
        }
        else {
            response.data = session;
        }
        return response;
    }
    async truckByOwner(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.truckByOwner(reqBody);
        if (!truckDetails) {
            response.success = false;
            response.message = "Session with driver " + reqBody.driver_id + " already in active";
        }
        else {
            response.data = truckDetails;
        }
        return response;
    }
    async driverByOwner(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const driverDetails = await this.truckService.driverByOwner(reqBody);
        if (!driverDetails) {
            response.success = false;
            response.message = "Session with driver " + reqBody.driver_id + " already in active";
        }
        else {
            response.data = driverDetails;
        }
        return response;
    }
    async addTruck(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.getTruckByTruckNumber(reqBody.registration_number);
        if (!truckDetails) {
            const truckD = await this.truckService.addTruck(reqBody);
            if (!truckD) {
                response.success = false;
                response.message = "Problem in saving " + reqBody.registration_number;
            }
            else {
                response.data = truckD;
            }
        }
        else {
            response.success = false;
            response.message = "Vehicle with registration number " + reqBody.registration_number + " already exists";
        }
        return response;
    }
    async updateTruck(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.updateTruck(id, reqBody);
        if (!truckDetails) {
            response.success = false;
            response.message = "Problem in updating Truck";
        }
        else {
            response.data = truckDetails;
        }
        return response;
    }
    async deleteTruck(id) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const truckDetails = await this.truckService.deleteTruck(id);
        if (!truckDetails) {
            response.success = false;
            response.message = "Problem in deleting Truck";
        }
        else {
            response.data = truckDetails;
        }
        return response;
    }
    async getTrucks(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const { items, count } = await this.truckService.getTrucks(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Trucks not found";
        }
        else {
            response.data = { trucks: items, count };
        }
        return response;
    }
};
__decorate([
    (0, common_1.Get)(''),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "getTruckDetails", null);
__decorate([
    (0, common_1.Post)(''),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "getTruck", null);
__decorate([
    (0, common_1.Post)('addSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "addSession", null);
__decorate([
    (0, common_1.Post)('getSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('truckByOwner'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "truckByOwner", null);
__decorate([
    (0, common_1.Post)('driverByOwner'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "driverByOwner", null);
__decorate([
    (0, common_1.Post)('addTruck'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "addTruck", null);
__decorate([
    (0, common_1.Post)('updateTruck/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "updateTruck", null);
__decorate([
    (0, common_1.Post)('deleteTruck/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "deleteTruck", null);
__decorate([
    (0, common_1.Post)('getTrucks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TruckController.prototype, "getTrucks", null);
TruckController = __decorate([
    (0, common_1.Controller)('trucks'),
    __metadata("design:paramtypes", [truck_service_1.TruckService])
], TruckController);
exports.TruckController = TruckController;
//# sourceMappingURL=truck.controller.js.map