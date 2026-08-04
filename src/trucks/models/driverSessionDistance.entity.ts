import { now } from "moment";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_session_distance')
export class DriverSessionDistanceEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    session_id: number
	
    @Column()
    tour_id: number

    @Column({nullable: true})
    tour_type: string

    @Column({nullable: true, type: 'numeric', precision: 10, scale: 5, default: 0})
    distance: string
}