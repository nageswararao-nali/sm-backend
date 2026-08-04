import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_customer_booking_logs')
export class CustomerBookingLogsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    customer_mobile: string

    @Column({nullable: true})
    log_type: string

    @Column({nullable: true})
    booking_data: string

    @CreateDateColumn()
    created_at: Date

}


	 
	