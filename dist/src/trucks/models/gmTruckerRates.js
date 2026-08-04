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
exports.GMTruckerRatesEntity = void 0;
const typeorm_1 = require("typeorm");
let GMTruckerRatesEntity = class GMTruckerRatesEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerRatesEntity.prototype, "driver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerRatesEntity.prototype, "vehicle_no", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "base_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "base_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "base_duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "rate_per_km", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerRatesEntity.prototype, "rate_per_hr", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ default: new Date() }),
    __metadata("design:type", Date)
], GMTruckerRatesEntity.prototype, "created_at", void 0);
GMTruckerRatesEntity = __decorate([
    (0, typeorm_1.Entity)('gm_trucker_rates')
], GMTruckerRatesEntity);
exports.GMTruckerRatesEntity = GMTruckerRatesEntity;
//# sourceMappingURL=gmTruckerRates.js.map