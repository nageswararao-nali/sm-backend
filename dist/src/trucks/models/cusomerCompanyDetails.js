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
exports.CustomerCompanyEntity = void 0;
const typeorm_1 = require("typeorm");
let CustomerCompanyEntity = class CustomerCompanyEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "company_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "users", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "return_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "return_percentage_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "min_base_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "extra_charge_percentage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "additional_pickup_charge", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CustomerCompanyEntity.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'T1', nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "waiting_charge_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "loading_charge", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "address_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "mobile", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "gst", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "billing_cycle", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: false }),
    __metadata("design:type", Boolean)
], CustomerCompanyEntity.prototype, "is_discount_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "discount_on_waiting_charges", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "discount_on_freight_charges", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], CustomerCompanyEntity.prototype, "dead_miles_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CustomerCompanyEntity.prototype, "is_regular", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CustomerCompanyEntity.prototype, "is_waiting_charges_include", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CustomerCompanyEntity.prototype, "has_daily_limit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "bap_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'No' }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "is_otp_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'No' }),
    __metadata("design:type", String)
], CustomerCompanyEntity.prototype, "is_delivery_proof_enabled", void 0);
CustomerCompanyEntity = __decorate([
    (0, typeorm_1.Entity)('customer_company')
], CustomerCompanyEntity);
exports.CustomerCompanyEntity = CustomerCompanyEntity;
//# sourceMappingURL=cusomerCompanyDetails.js.map