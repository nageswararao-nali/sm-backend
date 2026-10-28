import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

// One row per multi_booking_id group being broadcast to drivers.
@Entity('booking_dispatch')
export class BookingDispatchEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    multi_booking_id: string

    // 'broadcasting' | 'assigned' | 'expired'
    @Column({default: 'broadcasting'})
    status: string

    @Column({nullable: true})
    winner_driver_id: number

    @Column({nullable: true})
    winner_truck_id: number

    @Column({nullable: true})
    winner_truck_owner_id: number

    @Column({nullable: true})
    tour_id: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    expires_at: Date
}
