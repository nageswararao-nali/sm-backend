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
exports.TruckService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const moment = require("moment");
const typeorm_2 = require("typeorm");
const driver_entity_1 = require("../models/driver.entity");
const driverSessions_entity_1 = require("../models/driverSessions.entity");
const truck_entity_1 = require("../models/truck.entity");
let TruckService = class TruckService {
    constructor(driverSessionRepository, truckRepository, driverRepository) {
        this.driverSessionRepository = driverSessionRepository;
        this.truckRepository = truckRepository;
        this.driverRepository = driverRepository;
    }
    async addDriverSession(reqBody) {
        const sessionInput = {
            "driver_id": reqBody.driver_id,
            "start_location": reqBody.start_location
        };
        let activeSession = await this.driverSessionRepository.findOneBy({ user_id: reqBody.driver_id, status: true });
        if (!activeSession) {
            let session = await this.driverSessionRepository.save(sessionInput);
            return session;
        }
        else {
            return null;
        }
    }
    async getDriverSession(reqBody) {
        let activeSession = await this.driverSessionRepository.findOneBy({ user_id: reqBody.driver_id, status: true });
        if (activeSession) {
            const nowDate = moment(new Date());
            const startDate = moment(activeSession.session_start_time);
            let diff = nowDate.diff(startDate, 'minutes') - 330;
            let sessionData = Object.assign(Object.assign({}, activeSession), { duration: diff + " Mins", distance: '35' + "KM", noTours: 2 });
            return sessionData;
        }
        else {
            return null;
        }
    }
    async getTruck(truckId) {
        let truckDetails = await this.truckRepository.findOneBy({ id: truckId });
        return truckDetails;
    }
    async truckByOwner(reqBody) {
        let truckDetails = await this.truckRepository.findOneBy({ truck_owner_id: reqBody.truck_owner_id });
        return truckDetails;
    }
    async driverByOwner(reqBody) {
        let driverDetails = await this.driverRepository.findOneBy({ truck_owner_id: reqBody.truck_owner_id });
        return driverDetails;
    }
    async getTruckByTruckNumber(registration_number) {
        let truckDetails = await this.truckRepository.findOneBy({ registration_number: registration_number });
        return truckDetails;
    }
    async addTruck(reqBody) {
        const truckInput = {
            truck_owner_id: reqBody.truck_owner_id,
            registration_number: reqBody.registration_number,
            vehicle_type: reqBody.vehicle_type,
            capacity: reqBody.capacity,
            capacity_unit: reqBody.capacity_unit,
            opened_closed: reqBody.opened_closed,
            status: 'Available',
            soft_delete: 0
        };
        let truckData = await this.truckRepository.save(truckInput);
        return truckData;
    }
    async updateTruck(id, reqBody) {
        const truckInput = {
            truck_owner_id: reqBody.truck_owner_id,
            registration_number: reqBody.registration_number,
            vehicle_type: reqBody.vehicle_type,
            capacity: reqBody.capacity,
            capacity_unit: reqBody.capacity_unit,
            opened_closed: reqBody.opened_closed,
            status: 'Available',
            soft_delete: 0
        };
        const truckData = await this.truckRepository.update({ id }, truckInput);
        return truckData;
    }
    async updateTruckDetails(id, reqBody) {
        const truckData = await this.truckRepository.update({ id }, reqBody);
        return truckData;
    }
    async deleteTruck(id) {
        const truckData = await this.truckRepository.delete(id);
        return truckData;
    }
    async deleteByOwner(id) {
        const truckData = await this.truckRepository.delete({ truck_owner_id: id });
        return truckData;
    }
    async getTrucks(reqBody) {
        const [items, count] = await this.truckRepository.findAndCount({ order: { id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        return { items, count };
    }
};
TruckService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(driverSessions_entity_1.DriverSessionsEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(truck_entity_1.TrucksEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(driver_entity_1.DriversEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TruckService);
exports.TruckService = TruckService;
//# sourceMappingURL=truck.service.js.map