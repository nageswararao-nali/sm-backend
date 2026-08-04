import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('vehicle_live_data')
export class VehicleLiveDataEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    driver_id: number

    @Column({nullable: true})
    vehicle_id: number

    @Column({nullable: true})
    tour_id: number
    
    @Column({nullable: true, type: 'float'})
    volume: string

    @Column({nullable: true, type: 'float'})
    weight: string
    
    @CreateDateColumn()
    created_at: Date

}