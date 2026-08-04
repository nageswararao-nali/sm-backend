import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('tours', {
    orderBy: {
        id: 'DESC'
    }
})
export class ToursEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tour_date: string

    @Column()
    tour_time: string

    @Column({nullable: true, type: 'float'})
    tour_fare: string

    @Column()
    manager_status: string

    @Column({nullable: true})
    status: string

    @Column({nullable: true})
    tour_status: string

    @Column({nullable: true})
    current_status: number //assigned-1, accepted-2, completed=3

    @Column()
    truck_owner_status: string

    @Column({nullable: true})
    truck_owner_id: number

    @Column({nullable: true})
    driver_id: number

    @Column({nullable: true})
    manager_accept_truck_owner: string

    @Column({nullable: true})
    assign_truck_driver_screen_status: string

    @Column({nullable: true})
    assign_truck_driver_screen_status_time: string

    @Column({nullable: true})
    engaged_consolidation_manager: string

    @Column({nullable: true})
    sequence: string

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

    @Column({nullable: true})
    accept_time: string

    @Column({nullable: true})
    complete_time: string

    @Column({default: false})
    is_closed_tour: boolean

    @Column({default: false})
    is_delay: boolean

    @Column({nullable: true, default: 'GoodMove'})
    tour_for: string
    
}