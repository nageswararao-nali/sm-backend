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
exports.TripEntity = void 0;
const typeorm_1 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
let TripEntity = class TripEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TripEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TripEntity.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TripEntity.prototype, "booking_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TripEntity.prototype, "trip_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TripEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TripEntity.prototype, "tour_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TripEntity.prototype, "engaged_consolidation_manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripEntity.prototype, "pickup_location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TripEntity.prototype, "pickup_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripEntity.prototype, "dropoff_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripEntity.prototype, "dropoff_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TripEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], TripEntity.prototype, "pickup_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], TripEntity.prototype, "pickup_long", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], TripEntity.prototype, "dropoff_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], TripEntity.prototype, "dropoff_long", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], TripEntity.prototype, "pickup_point", void 0);
__decorate([
    (0, typeorm_1.Index)({ spatial: true }),
    (0, typeorm_1.Column)({ type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true }),
    __metadata("design:type", Object)
], TripEntity.prototype, "dropoff_point", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TripEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TripEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], TripEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TripEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => booking_entity_1.BookingEntity, (booking) => booking.id),
    __metadata("design:type", booking_entity_1.BookingEntity)
], TripEntity.prototype, "booking", void 0);
TripEntity = __decorate([
    (0, typeorm_1.Entity)('trips')
], TripEntity);
exports.TripEntity = TripEntity;
//# sourceMappingURL=trip.entity.js.map