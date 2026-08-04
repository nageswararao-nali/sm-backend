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
exports.DriverSessionsEntity = void 0;
const typeorm_1 = require("typeorm");
let DriverSessionsEntity = class DriverSessionsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "start_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "end_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DriverSessionsEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSessionsEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSessionsEntity.prototype, "session_start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: null }),
    __metadata("design:type", Date)
], DriverSessionsEntity.prototype, "session_end_time", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriverSessionsEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "start_odometer_reading", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "end_odometer_reading", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "start_odometer_photo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "end_odometer_photo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "start_buffer_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "end_buffer_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "total_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0 }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "parent_session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DriverSessionsEntity.prototype, "is_closed_session", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DriverSessionsEntity.prototype, "paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverSessionsEntity.prototype, "final_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionsEntity.prototype, "notes", void 0);
DriverSessionsEntity = __decorate([
    (0, typeorm_1.Entity)('go_sessions')
], DriverSessionsEntity);
exports.DriverSessionsEntity = DriverSessionsEntity;
//# sourceMappingURL=driverSessions.entity.js.map