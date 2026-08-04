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
exports.PaymentTransactionsEntity = void 0;
const typeorm_1 = require("typeorm");
let PaymentTransactionsEntity = class PaymentTransactionsEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentTransactionsEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "order_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "tracking_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "bank_ref_no", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "payment_mode", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "card_name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PaymentTransactionsEntity.prototype, "transaction_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionsEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionsEntity.prototype, "updated_at", void 0);
PaymentTransactionsEntity = __decorate([
    (0, typeorm_1.Entity)('payment_transactions')
], PaymentTransactionsEntity);
exports.PaymentTransactionsEntity = PaymentTransactionsEntity;
//# sourceMappingURL=paymentTransactions.entity.js.map