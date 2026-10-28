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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchTimeoutProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bookingDispatch_entity_1 = require("../models/bookingDispatch.entity");
const bookingDispatchCandidate_entity_1 = require("../models/bookingDispatchCandidate.entity");
let DispatchTimeoutProcessor = class DispatchTimeoutProcessor extends bullmq_1.WorkerHost {
    constructor(dispatchRepo, dispatchCandidateRepo) {
        super();
        this.dispatchRepo = dispatchRepo;
        this.dispatchCandidateRepo = dispatchCandidateRepo;
    }
    async process(job) {
        const { multiBookingId } = job.data;
        const updateResult = await this.dispatchRepo.createQueryBuilder()
            .update(bookingDispatch_entity_1.BookingDispatchEntity)
            .set({ status: 'expired' })
            .where('multi_booking_id = :id AND status = :s', { id: multiBookingId, s: 'broadcasting' })
            .execute();
        if (updateResult.affected) {
            await this.dispatchCandidateRepo.update({ multi_booking_id: multiBookingId, status: 'pending' }, { status: 'expired' });
            console.log('dispatch-timeout: expired with no acceptance', multiBookingId);
        }
    }
};
DispatchTimeoutProcessor = __decorate([
    (0, bullmq_1.Processor)('dispatch-timeout'),
    __param(0, (0, typeorm_1.InjectRepository)(bookingDispatch_entity_1.BookingDispatchEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(bookingDispatchCandidate_entity_1.BookingDispatchCandidateEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DispatchTimeoutProcessor);
exports.DispatchTimeoutProcessor = DispatchTimeoutProcessor;
//# sourceMappingURL=dispatch-timeout.processor.js.map