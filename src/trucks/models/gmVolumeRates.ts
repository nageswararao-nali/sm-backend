import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('gm_volume_rates')
export class VolumeRateDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true, type: 'float'})
    quantity: string

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
}