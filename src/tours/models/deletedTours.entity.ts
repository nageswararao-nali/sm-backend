import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('deleted_tours')
export class DeletedToursEntity {
    @Column({nullable: true})
    tour_id: number

    @Column({nullable: true})
    tour_data: string

    @Column({nullable: true})
    tour_route_data: string

    @Column({nullable: true})
    deleted_by: string

    @CreateDateColumn({default: new Date()})
    created_at: Date
}
