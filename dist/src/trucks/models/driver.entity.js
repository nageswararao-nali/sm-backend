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
exports.DriversEntity = void 0;
const typeorm_1 = require("typeorm");
let DriversEntity = class DriversEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriversEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "truck_owner_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriversEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriversEntity.prototype, "mobile_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriversEntity.prototype, "license_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriversEntity.prototype, "license_proof", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriversEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "soft_delete", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'scheme1' }),
    __metadata("design:type", String)
], DriversEntity.prototype, "scheme_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriversEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriversEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DriversEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], DriversEntity.prototype, "is_darkroom", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ nullable: true }),
    __metadata("design:type", Date)
], DriversEntity.prototype, "last_tracked_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ nullable: true }),
    __metadata("design:type", Date)
], DriversEntity.prototype, "last_notification_at", void 0);
DriversEntity = __decorate([
    (0, typeorm_1.Entity)('drivers')
], DriversEntity);
exports.DriversEntity = DriversEntity;
//# sourceMappingURL=driver.entity.js.map