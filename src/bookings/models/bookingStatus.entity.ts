import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('booking_status')
export class BookingStatusEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    booking_id: number

    @Column({nullable: true})
    trip_id: string

    @Column({nullable: true})
    tour_id: number

    @Column()
    status: string
    
    @Column()
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

}
