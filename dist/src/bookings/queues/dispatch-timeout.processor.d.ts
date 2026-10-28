import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { BookingDispatchEntity } from '../models/bookingDispatch.entity';
import { BookingDispatchCandidateEntity } from '../models/bookingDispatchCandidate.entity';
export declare class DispatchTimeoutProcessor extends WorkerHost {
    private dispatchRepo;
    private dispatchCandidateRepo;
    constructor(dispatchRepo: Repository<BookingDispatchEntity>, dispatchCandidateRepo: Repository<BookingDispatchCandidateEntity>);
    process(job: Job<{
        multiBookingId: string;
    }>): Promise<any>;
}
