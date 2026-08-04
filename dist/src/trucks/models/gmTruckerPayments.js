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
exports.GMTruckerPaymentsEntity = void 0;
const typeorm_1 = require("typeorm");
let GMTruckerPaymentsEntity = class GMTruckerPaymentsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "driver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "owner_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "vehicle_no", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "payment_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GMTruckerPaymentsEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GMTruckerPaymentsEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ default: new Date() }),
    __metadata("design:type", Date)
], GMTruckerPaymentsEntity.prototype, "created_at", void 0);
GMTruckerPaymentsEntity = __decorate([
    (0, typeorm_1.Entity)('gm_trucker_payments')
], GMTruckerPaymentsEntity);
exports.GMTruckerPaymentsEntity = GMTruckerPaymentsEntity;
//# sourceMappingURL=gmTruckerPayments.js.map