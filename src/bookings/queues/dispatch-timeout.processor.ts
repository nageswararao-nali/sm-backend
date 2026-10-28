import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { BookingDispatchEntity } from '../models/bookingDispatch.entity';
import { BookingDispatchCandidateEntity } from '../models/bookingDispatchCandidate.entity';

// v1 scope: escalate only. If nobody accepted within the delay, mark the group expired
// and leave it for the existing manual addTour flow / ops to pick up - no automatic
// re-broadcast-to-wider-radius yet (documented as a natural v2 enhancement).
@Processor('dispatch-timeout')
export class DispatchTimeoutProcessor extends WorkerHost {
    constructor(
        @InjectRepository(BookingDispatchEntity)
        private dispatchRepo: Repository<BookingDispatchEntity>,
        @InjectRepository(BookingDispatchCandidateEntity)
        private dispatchCandidateRepo: Repository<BookingDispatchCandidateEntity>,
    ) {
        super();
    }

    async process(job: Job<{ multiBookingId: string }>): Promise<any> {
        const { multiBookingId } = job.data;

        const updateResult = await this.dispatchRepo.createQueryBuilder()
            .update(BookingDispatchEntity)
            .set({ status: 'expired' })
            .where('multi_booking_id = :id AND status = :s', { id: multiBookingId, s: 'broadcasting' })
            .execute();

        if (updateResult.affected) {
            await this.dispatchCandidateRepo.update(
                { multi_booking_id: multiBookingId, status: 'pending' },
                { status: 'expired' }
            );
            console.log('dispatch-timeout: expired with no acceptance', multiBookingId);
        }
    }
}
