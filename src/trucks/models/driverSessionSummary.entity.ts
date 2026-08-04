import { now } from "moment";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_session_summary')
export class DriverSessionSummaryEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user_id: number

    @Column({nullable: true})
    driver_name: string

    @Column({nullable: true})
    session_date: string
	
    @CreateDateColumn()
    created_at: Date
	
    @Column({nullable: true, default: null})
    session_ids: string

    @CreateDateColumn()
    updated_at: Date

    @Column({nullable: true})
    total_time: number

    @Column({nullable: true})
    total_revenue: number

    @Column({nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0})
    total_distance: string

    @Column({default: false})
    paid: boolean

    @Column({nullable: true})
    fare: number

    @Column({nullable: true})
    notes: string

    @Column({nullable: true, default: 0})
    local_trips: number

    @Column({nullable: true, default: 0})
    long_haul_trips: number
}