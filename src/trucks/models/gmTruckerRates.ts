import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_trucker_rates')
export class GMTruckerRatesEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    driver_id: number

    @Column({nullable: true})
    driver_name: string

    @Column({nullable: true})
    truck_id: number

    @Column({nullable: true})
    vehicle_no: string

    @Column({default: 0})
    base_rate: number

    @Column({default: 0})
    base_distance: number

    @Column({default: 0})
    base_duration: number

    @Column({default: 0})
    rate_per_km: number

    @Column({default: 0})
    rate_per_hr: number

    @CreateDateColumn({default: new Date()})
    created_at: Date
}