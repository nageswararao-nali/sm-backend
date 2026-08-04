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
exports.ConsolidationCenterEntity = void 0;
const typeorm_1 = require("typeorm");
let ConsolidationCenterEntity = class ConsolidationCenterEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ConsolidationCenterEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "unique_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "zip_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ConsolidationCenterEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], ConsolidationCenterEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ConsolidationCenterEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConsolidationCenterEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ConsolidationCenterEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConsolidationCenterEntity.prototype, "updated_at", void 0);
ConsolidationCenterEntity = __decorate([
    (0, typeorm_1.Entity)('consolidation_centers')
], ConsolidationCenterEntity);
exports.ConsolidationCenterEntity = ConsolidationCenterEntity;
//# sourceMappingURL=consolidationCenters.entity.js.map