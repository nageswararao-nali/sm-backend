import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('shops')
export class ShopsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    contact_number: string

    @Column({nullable: true})
    shop_name: string

    @Column({nullable: true})
    address: string

    @Column({nullable: true})
    shop_type: string

    @Column({nullable: true})
    qr_url: string

    @Column({nullable: true})
    status: string
	
    @Column({nullable: true, type: 'real'})
    latitude: string

    @Column({nullable: true, type: 'real'})
    longitude: string
	
    @Index({spatial: true})
    @Column({type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true})
    location: Point

    @CreateDateColumn({nullable: true})
    created_at: Date

    @CreateDateColumn({nullable: true})
    updated_at: Date
}