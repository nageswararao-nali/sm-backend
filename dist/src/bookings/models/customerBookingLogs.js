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
exports.CustomerBookingLogsEntity = void 0;
const typeorm_1 = require("typeorm");
let CustomerBookingLogsEntity = class CustomerBookingLogsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CustomerBookingLogsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerBookingLogsEntity.prototype, "customer_mobile", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerBookingLogsEntity.prototype, "log_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomerBookingLogsEntity.prototype, "booking_data", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerBookingLogsEntity.prototype, "created_at", void 0);
CustomerBookingLogsEntity = __decorate([
    (0, typeorm_1.Entity)('gm_customer_booking_logs')
], CustomerBookingLogsEntity);
exports.CustomerBookingLogsEntity = CustomerBookingLogsEntity;
//# sourceMappingURL=customerBookingLogs.js.map