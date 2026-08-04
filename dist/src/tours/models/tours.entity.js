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
exports.ToursEntity = void 0;
const typeorm_1 = require("typeorm");
let ToursEntity = class ToursEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ToursEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_fare", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ToursEntity.prototype, "manager_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ToursEntity.prototype, "current_status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ToursEntity.prototype, "truck_owner_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ToursEntity.prototype, "truck_owner_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ToursEntity.prototype, "driver_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "manager_accept_truck_owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "assign_truck_driver_screen_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "assign_truck_driver_screen_status_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "engaged_consolidation_manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "sequence", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ToursEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ToursEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ToursEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ToursEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "accept_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ToursEntity.prototype, "complete_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ToursEntity.prototype, "is_closed_tour", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ToursEntity.prototype, "is_delay", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'GoodMove' }),
    __metadata("design:type", String)
], ToursEntity.prototype, "tour_for", void 0);
ToursEntity = __decorate([
    (0, typeorm_1.Entity)('tours', {
        orderBy: {
            id: 'DESC'
        }
    })
], ToursEntity);
exports.ToursEntity = ToursEntity;
//# sourceMappingURL=tours.entity.js.map