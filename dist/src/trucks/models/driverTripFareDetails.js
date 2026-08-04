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
exports.DriverTripFareDetailsEntity = void 0;
const typeorm_1 = require("typeorm");
let DriverTripFareDetailsEntity = class DriverTripFareDetailsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverTripFareDetailsEntity.prototype, "tour_ids", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverTripFareDetailsEntity.prototype, "booking_ids", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "total_fare", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "no_points", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverTripFareDetailsEntity.prototype, "trip_weight", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverTripFareDetailsEntity.prototype, "trip_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DriverTripFareDetailsEntity.prototype, "trip_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverTripFareDetailsEntity.prototype, "trip_notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ default: new Date() }),
    __metadata("design:type", Date)
], DriverTripFareDetailsEntity.prototype, "created_at", void 0);
DriverTripFareDetailsEntity = __decorate([
    (0, typeorm_1.Entity)('driver_trip_fare_details')
], DriverTripFareDetailsEntity);
exports.DriverTripFareDetailsEntity = DriverTripFareDetailsEntity;
//# sourceMappingURL=driverTripFareDetails.js.map