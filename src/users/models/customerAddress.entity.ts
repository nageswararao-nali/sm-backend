import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('customer_address')
export class CustomerAddressEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    address: string;

    @Column({nullable: true})
    address_type: string;

    @Column({nullable: true})
    city: string;

    @Column({nullable: true})
    state: string;

    @Column({nullable: true})
    country: string;

    @Column()
    customer_id: number;

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

    @Column({nullable: true})
    mobile: string;

    @Column({nullable: true})
    pincode: string;

    @Column({nullable: true})
    receiver_contact: string;

    @Column({nullable: true})
    receiver_name: string;

    @Column({default: false})
    is_live: boolean;

    @Column()
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date
}
