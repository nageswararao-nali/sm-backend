import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_trip_fare_details')
export class DriverTripFareDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    driver_id: number

    @Column()
    tour_ids: string

    @Column()
    booking_ids: string

    @Column()
    total_fare: number

    @Column()
    total_distance: number

    @Column({nullable: true})
    customer_id: number

    @Column()
    no_points: number

    @Column({nullable: true})
    trip_weight: number

    @Column()
    trip_date: string

    @Column()
    trip_type: string

    @Column({nullable: true})
    trip_notes: string

    @CreateDateColumn({default: new Date()})
    created_at: Date
}