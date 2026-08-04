import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_trucker_payments')
export class GMTruckerPaymentsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    driver_id: number

    @Column({nullable: true})
    driver_name: string

    @Column({nullable: true})
    owner_name: string

    @Column({nullable: true})
    truck_id: number

    @Column({nullable: true})
    vehicle_no: string

    @Column({nullable: true})
    start_time: string

    @Column({nullable: true})
    end_time: string

    @Column({nullable: true})
    payment_date: string

    @Column({default: 0})
    distance: number

    @Column({default: 0})
    duration: number

    @Column({default: 0})
    amount: number

    @Column({nullable: true})
    status: string

    @Column({nullable: true})
    notes: string

    @CreateDateColumn({default: new Date()})
    created_at: Date

}