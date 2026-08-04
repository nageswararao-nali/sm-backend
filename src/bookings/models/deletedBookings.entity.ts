import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('deleted_bookings')
export class DeletedBookingsEntity {
    @PrimaryGeneratedColumn()
    id: number
    
    @Column({nullable: true})
    booking_id: number

    @Column({nullable: true})
    booking_data: string

    @Column({nullable: true})
    deleted_by: string

    @CreateDateColumn({default: new Date()})
    created_at: Date
}
