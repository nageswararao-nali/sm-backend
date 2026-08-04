import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_last_location_details')
export class DriverLastLocationDetails {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    driver_id: number

    @Column({nullable: true})
    truck_id: number

    @Column({nullable: true})
    vehicle_type: string

    @Column({nullable: true, type: 'real'})
    latitude: string

    @Column({nullable: true, type: 'real'})
    longitude: string
    
    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    location: Point

    @Column({nullable: true})
    last_tracked_at: string    
}