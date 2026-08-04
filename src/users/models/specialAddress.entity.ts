import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('special_address')
export class SpecialAddressEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    address: string;

    @Column({nullable: true})
    city: string;

    @Column({nullable: true})
    state: string;

    @Column({nullable: true})
    country: string;

    @Column({nullable: true, type: 'float'})
    latitude: string;

    @Column({nullable: true, type: 'float'})
    longitude: string;

    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    location: Point

    @Column({default: 0})
    amount: number;

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date
}
