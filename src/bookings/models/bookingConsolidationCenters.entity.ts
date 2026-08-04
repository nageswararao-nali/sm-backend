import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('booking_consolidation_centers')
export class BookingConsolidationCentersEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
	unique_id: string

	@Column({nullable: true})
    booking_id: number
	
    @Column({nullable: true})
    drop_at: string
	
    @Column({nullable: true})
    pickup_location: string
	
    @Column({nullable: true})
    dropoff_location: string
	
    @Column({nullable: true})
    pickup_time: string
	
    @Column({nullable: true})
    dropoff_time: string
	
    @Column({nullable: true})
    tour_assign: number
	
    @Column({nullable: true})
    booking_at_consolidation_center_tour_status: string
	
    @Column({nullable: true, type: 'float'})
    pickup_lat: string
	
    @Column({nullable: true, type: 'float'})
    pickup_long: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_lat: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_long: string
	
    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date
}