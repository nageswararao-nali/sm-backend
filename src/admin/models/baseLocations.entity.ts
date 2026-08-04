import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('base_locations')
export class BaseLocationsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    unique_id: string
	
    @Column({nullable: true})
    address: string
	
    @Column({nullable: true})
    city: string

    @Column({nullable: true})
    state: string
    
    @Column({nullable: true})
    country: string

    @Column({nullable: true})
    zip_code: string
	
    @Column({nullable: true})
    latitude: string
	
    @Column({nullable: true})
    longitude: string

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    location: Point

    @Column({nullable: true, default: false})
    is_main_base: boolean

    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date


}