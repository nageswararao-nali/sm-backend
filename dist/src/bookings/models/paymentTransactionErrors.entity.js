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
exports.PaymentTransactionErrorsEntity = void 0;
const typeorm_1 = require("typeorm");
let PaymentTransactionErrorsEntity = class PaymentTransactionErrorsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentTransactionErrorsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionErrorsEntity.prototype, "payment_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionErrorsEntity.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionErrorsEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionErrorsEntity.prototype, "updated_at", void 0);
PaymentTransactionErrorsEntity = __decorate([
    (0, typeorm_1.Entity)('payment_transaction_errors')
], PaymentTransactionErrorsEntity);
exports.PaymentTransactionErrorsEntity = PaymentTransactionErrorsEntity;
//# sourceMappingURL=paymentTransactionErrors.entity.js.map