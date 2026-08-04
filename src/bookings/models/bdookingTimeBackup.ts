import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('booking_time_backup')
export class BookingTimeBackupEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    booking_id: number

    @Column({nullable: true})
    waiting_charge: string

    @Column({nullable: true})
    reached_pickup: string

    @Column({nullable: true})
    completed_pickup: string

    @Column({nullable: true})
    reached_drop: string

    @Column({nullable: true})
    completed_drop: string

    @Column({nullable: true, default: 0})
    waiting_time: number

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date

}


	 
	