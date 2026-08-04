import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_driver_rates')
export class GMDriverRatesEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    scheme_name: string

    @Column({nullable: true})
    truck_type: string

    @Column({default: 0})
    base_rate: number

    @Column({default: 0})
    base_distance: number

    @Column({default: 0})
    base_duration: number

    @Column({default: 0})
    rate_per_km: string

    @Column({default: 0})
    rate_per_hr: number

    @CreateDateColumn({default: new Date()})
    created_at: Date
}