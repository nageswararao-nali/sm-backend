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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourAssignTruckDriversEntity = void 0;
const typeorm_1 = require("typeorm");
let TourAssignTruckDriversEntity = class TourAssignTruckDriversEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "tour_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "truck_owner_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TourAssignTruckDriversEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TourAssignTruckDriversEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TourAssignTruckDriversEntity.prototype, "updated_at", void 0);
TourAssignTruckDriversEntity = __decorate([
    (0, typeorm_1.Entity)('tour_assign_truck_drivers')
], TourAssignTruckDriversEntity);
exports.TourAssignTruckDriversEntity = TourAssignTruckDriversEntity;
//# sourceMappingURL=tourAssignTruckDrivers.entity.js.map