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
exports.CustomerAddressEntity = void 0;
const typeorm_1 = require("typeorm");
let CustomerAddressEntity = class CustomerAddressEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CustomerAddressEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "address_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CustomerAddressEntity.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], CustomerAddressEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "mobile", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "receiver_contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerAddressEntity.prototype, "receiver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CustomerAddressEntity.prototype, "is_live", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], CustomerAddressEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerAddressEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], CustomerAddressEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerAddressEntity.prototype, "updated_at", void 0);
CustomerAddressEntity = __decorate([
    (0, typeorm_1.Entity)('customer_address')
], CustomerAddressEntity);
exports.CustomerAddressEntity = CustomerAddressEntity;
//# sourceMappingURL=customerAddress.entity.js.map