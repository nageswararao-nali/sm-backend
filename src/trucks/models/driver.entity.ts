import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('drivers')
export class DriversEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    truck_owner_id: number

    @Column({nullable: true})
    truck_id: number

    @Column({nullable: true})
    user_id: number
	
    @Column({nullable: true})
    name: string
	
    @Column({nullable: true})
    mobile_number: string
	
    @Column({nullable: true})
    license_number: string
	
    @Column({nullable: true})
    license_proof: string
	
    @Column({nullable: true})
    status: string
	
    @Column({default: 0})
    soft_delete: number

    @Column({default: 'scheme1'})
    scheme_name: string

    @Column({default: 0})
    wallet: number
	
    @Column({nullable: true})
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

    @Column({nullable: true, default: false})
    is_darkroom: boolean

    @CreateDateColumn({nullable: true})
    last_tracked_at: Date

    @CreateDateColumn({nullable: true})
    last_notification_at: Date
    
}