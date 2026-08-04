import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('customer_address_rates')
export class CustomerAddressRatesEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    company_id: number

    @Column()
    address_id: number

    @Column('decimal', { precision: 10, scale: 2 })
    fare: number

    @Column('decimal', { precision: 10, scale: 2 })
    return_fare: number

}