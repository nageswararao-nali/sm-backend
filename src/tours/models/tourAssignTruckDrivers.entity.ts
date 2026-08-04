import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tour_assign_truck_drivers')
export class TourAssignTruckDriversEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tour_id: number
	
    @Column()
    truck_owner_id: number
	
    @Column()
    truck_id: number
	
    @Column()
    driver_id: number
	
    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date
}