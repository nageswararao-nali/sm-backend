import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

// One row per driver a multi_booking_id group was broadcast to.
@Entity('booking_dispatch_candidates')
export class BookingDispatchCandidateEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    multi_booking_id: string

    // this is the driver's user_id (see driver_last_location_details.driver_id, which is
    // actually a user_id despite the column name - addTour/acceptTour expect the same)
    @Column()
    driver_id: number

    @Column({nullable: true})
    truck_id: number

    @Column({nullable: true})
    truck_owner_id: number

    @Column({nullable: true})
    push_token: string

    // 'pending' | 'accepted' | 'lost' | 'expired'
    @Column({default: 'pending'})
    status: string

    @CreateDateColumn()
    notified_at: Date

    @Column({nullable: true})
    responded_at: Date
}
