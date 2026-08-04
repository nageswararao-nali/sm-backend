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
exports.DriverSessionDistanceEntity = void 0;
const typeorm_1 = require("typeorm");
let DriverSessionDistanceEntity = class DriverSessionDistanceEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DriverSessionDistanceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverSessionDistanceEntity.prototype, "session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DriverSessionDistanceEntity.prototype, "tour_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DriverSessionDistanceEntity.prototype, "tour_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0 }),
    __metadata("design:type", String)
], DriverSessionDistanceEntity.prototype, "distance", void 0);
DriverSessionDistanceEntity = __decorate([
    (0, typeorm_1.Entity)('driver_session_distance')
], DriverSessionDistanceEntity);
exports.DriverSessionDistanceEntity = DriverSessionDistanceEntity;
//# sourceMappingURL=driverSessionDistance.entity.js.map