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
exports.BookingConsolidationCentersEntity = void 0;
const typeorm_1 = require("typeorm");
let BookingConsolidationCentersEntity = class BookingConsolidationCentersEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BookingConsolidationCentersEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "unique_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingConsolidationCentersEntity.prototype, "booking_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "drop_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "pickup_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "dropoff_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "pickup_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "dropoff_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingConsolidationCentersEntity.prototype, "tour_assign", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "booking_at_consolidation_center_tour_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "pickup_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "pickup_long", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "dropoff_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingConsolidationCentersEntity.prototype, "dropoff_long", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingConsolidationCentersEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookingConsolidationCentersEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingConsolidationCentersEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookingConsolidationCentersEntity.prototype, "updated_at", void 0);
BookingConsolidationCentersEntity = __decorate([
    (0, typeorm_1.Entity)('booking_consolidation_centers')
], BookingConsolidationCentersEntity);
exports.BookingConsolidationCentersEntity = BookingConsolidationCentersEntity;
//# sourceMappingURL=bookingConsolidationCenters.entity.js.map