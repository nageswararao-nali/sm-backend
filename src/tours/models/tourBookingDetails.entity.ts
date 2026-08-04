import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tour_booking_details')
export class TourBookingDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tour_id: number

    @Column({nullable: true})
    booking_id: number

    @Column({nullable: true, type: 'float'})
    booking_fare: string

    @Column({nullable: true})
    booking_at_center_id: number

    @Column({nullable: true})
    truck_owner_status: string

    @Column({nullable: true})
    manager_status_tour_booking_detail: string

    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

}