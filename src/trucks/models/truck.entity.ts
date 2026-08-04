import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('trucks')
export class TrucksEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    truck_owner_id: number
	
    @Column({nullable: true})
    registration_number: string
	
    @Column({nullable: true})
    vehicle_type: string
	
    @Column({nullable: true})
    capacity: number
	
    @Column({nullable: true})
    capacity_unit: string
	
    @Column({nullable: true})
    opened_closed: string
	
    @Column({nullable: true})
    status: string
	
    @Column({nullable: true})
    soft_delete: number
	
    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date
}