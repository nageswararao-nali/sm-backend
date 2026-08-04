import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_rates')
export class RateDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number

    @Column()
    base_rate: number

    @Column()
    rate_per_km: number

    @Column()
    loading: number

    @Column()
    unloading: number

    @Column()
    loading_unloading: number

    @Column({default: 0})
    company_id: number
}