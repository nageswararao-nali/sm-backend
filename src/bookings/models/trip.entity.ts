import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BookingEntity } from "./booking.entity";

@Entity('trips')
export class TripEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    customer_id: number

    @Column()
    booking_id: number

    @Column()
    trip_id: string

    @Column({nullable: true})
    driver_id: number

    @Column({nullable: true})
    tour_id: number

    @Column()
    engaged_consolidation_manager: number

    @Column({nullable: true})
    pickup_location: string

    @Column()
    pickup_time: string

    @Column({nullable: true})
    dropoff_location: string

    @Column({nullable: true})
    dropoff_time: string

    @Column({nullable: true})
    status: string

    @Column({nullable: true, type: 'float'})
    pickup_lat: string
	
    @Column({nullable: true, type: 'float'})
    pickup_long: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_lat: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_long: string
	
    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    pickup_point: Point

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    dropoff_point: Point
    
    @Column()
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

    @ManyToOne(() => BookingEntity, (booking) => booking.id)
    booking: BookingEntity;

}
