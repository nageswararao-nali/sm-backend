import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_pending_bookings')
export class PendingBookingEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    customer_id: number

    @Column({nullable: true})
    booking_data: string

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date
}


	 
	