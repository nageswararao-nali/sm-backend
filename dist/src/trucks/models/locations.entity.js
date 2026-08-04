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
exports.LocationsEntity = void 0;
const typeorm_1 = require("typeorm");
let LocationsEntity = class LocationsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LocationsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LocationsEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], LocationsEntity.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], LocationsEntity.prototype, "tour_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'real' }),
    __metadata("design:type", String)
], LocationsEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'real' }),
    __metadata("design:type", String)
], LocationsEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], LocationsEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LocationsEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], LocationsEntity.prototype, "loc_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LocationsEntity.prototype, "is_distance_calculated", void 0);
LocationsEntity = __decorate([
    (0, typeorm_1.Entity)('go_locations')
], LocationsEntity);
exports.LocationsEntity = LocationsEntity;
//# sourceMappingURL=locations.entity.js.map