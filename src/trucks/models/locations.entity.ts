import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('go_locations')
export class LocationsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user_id: number

    @Column({nullable: true})
    session_id: number

    @Column({nullable: true})
    tour_id: number
	
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

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    loc_time: string

    @Column({default: false})
    is_distance_calculated: boolean
    
}