import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('tour_route')
export class TourRouteEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tour_id: number

    @Column()
    booking_id: number

    @Column({nullable: true})
    trip_id: string

    @Column()
    transport_type: string // pickup or dropoff

    @Column({nullable: true})
    consolidation_center_id: number

    @Column()
    sequence_number: number

    @Column({nullable: true})
    location_address: string

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    location: Point

    @Column({nullable: true})
    status: string

    @Column()
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

    @Column({nullable: true})
    tour_type: string

    @Column({default: false})
    is_to_base: boolean

    @Column({nullable: true})
    estimated_time: string

    @Column({nullable: true})
    completed_time: string

}