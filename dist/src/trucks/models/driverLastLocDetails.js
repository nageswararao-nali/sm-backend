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
exports.DriverLastLocationDetails = void 0;
const typeorm_1 = require("typeorm");
let DriverLastLocationDetails = class DriverLastLocationDetails {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverLastLocationDetails.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverLastLocationDetails.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], DriverLastLocationDetails.prototype, "truck_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverLastLocationDetails.prototype, "vehicle_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'real' }),
    __metadata("design:type", String)
], DriverLastLocationDetails.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'real' }),
    __metadata("design:type", String)
], DriverLastLocationDetails.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], DriverLastLocationDetails.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverLastLocationDetails.prototype, "last_tracked_at", void 0);
DriverLastLocationDetails = __decorate([
    (0, typeorm_1.Entity)('driver_last_location_details')
], DriverLastLocationDetails);
exports.DriverLastLocationDetails = DriverLastLocationDetails;
//# sourceMappingURL=driverLastLocDetails.js.map