import { now } from "moment";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('go_sessions')
export class DriverSessionsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user_id: number
	
    @Column({nullable: true})
    start_location: string
	
    @Column({nullable: true})
    end_location: string
	
    // status true means active, false means session closed
    @Column({default: true})
    status: boolean

    @CreateDateColumn()
    created_at: Date
	
    @CreateDateColumn()
    session_start_time: Date

    @Column({nullable: true, default: null})
    session_end_time: Date

    @CreateDateColumn()
    updated_at: Date

    @Column({nullable: true})
    start_odometer_reading: number

    @Column({nullable: true})
    end_odometer_reading: number

    @Column({nullable: true})
    start_odometer_photo: string

    @Column({nullable: true})
    end_odometer_photo: string

    @Column({nullable: true})
    start_buffer_time: number

    @Column({nullable: true})
    end_buffer_time: number

    @Column({nullable: true})
    total_time: string

    @Column({nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0})
    total_distance: string

    @Column({nullable: true})
    parent_session_id: number

    @Column({default: false})
    is_closed_session: boolean

    @Column({default: false})
    paid: boolean

    @Column({nullable: true})
    fare: number

    @Column({nullable: true})
    final_fare: number

    @Column({nullable: true})
    notes: string
}