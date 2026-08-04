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
exports.DriverSessionSummaryEntity = void 0;
const typeorm_1 = require("typeorm");
let DriverSessionSummaryEntity = class DriverSessionSummaryEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionSummaryEntity.prototype, "driver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionSummaryEntity.prototype, "session_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSessionSummaryEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: null }),
    __metadata("design:type", String)
], DriverSessionSummaryEntity.prototype, "session_ids", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSessionSummaryEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "total_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "total_revenue", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0 }),
    __metadata("design:type", String)
], DriverSessionSummaryEntity.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DriverSessionSummaryEntity.prototype, "paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionSummaryEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "local_trips", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], DriverSessionSummaryEntity.prototype, "long_haul_trips", void 0);
DriverSessionSummaryEntity = __decorate([
    (0, typeorm_1.Entity)('driver_session_summary')
], DriverSessionSummaryEntity);
exports.DriverSessionSummaryEntity = DriverSessionSummaryEntity;
//# sourceMappingURL=driverSessionSummary.entity.js.map