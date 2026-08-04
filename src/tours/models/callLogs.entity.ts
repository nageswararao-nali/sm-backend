import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('go_call_logs')
export class CallLogsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    driver_id: number

    @Column({nullable: true})
    booking_id: number

    @Column({default: 0})
    calls_count: number

    @Column({nullable: true})
    last_call_time: string

    @CreateDateColumn()
    created_at: Date

}