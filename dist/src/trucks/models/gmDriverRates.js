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
exports.GMDriverRatesEntity = void 0;
const typeorm_1 = require("typeorm");
let GMDriverRatesEntity = class GMDriverRatesEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GMDriverRatesEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMDriverRatesEntity.prototype, "scheme_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMDriverRatesEntity.prototype, "truck_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMDriverRatesEntity.prototype, "base_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMDriverRatesEntity.prototype, "base_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMDriverRatesEntity.prototype, "base_duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", String)
], GMDriverRatesEntity.prototype, "rate_per_km", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMDriverRatesEntity.prototype, "rate_per_hr", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ default: new Date() }),
    __metadata("design:type", Date)
], GMDriverRatesEntity.prototype, "created_at", void 0);
GMDriverRatesEntity = __decorate([
    (0, typeorm_1.Entity)('gm_driver_rates')
], GMDriverRatesEntity);
exports.GMDriverRatesEntity = GMDriverRatesEntity;
//# sourceMappingURL=gmDriverRates.js.map