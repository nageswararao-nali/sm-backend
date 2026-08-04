import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('customer_company')
export class CustomerCompanyEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    company_name: string

    @Column()
    users: string

    @Column()
    return_percentage: number

    @Column({nullable: true, type: 'decimal', precision: 10, scale: 2, default: 0})
    return_percentage_value: number

    @Column({nullable: true})
    min_base_fare: number

    @Column({nullable: true})
    extra_charge_percentage: number

    @Column({nullable: true})
    additional_pickup_charge: number

    @Column({default: true})
    is_active: boolean

    @Column({default: 'T1', nullable: true})
    waiting_charge_type: string

    @Column({nullable: true})
    name: string

    @Column({default: 0})
    loading_charge: number

    @Column({nullable: true})
    address_id: number

    @Column({nullable: true})
    mobile: string

    @Column({nullable: true})
    email: string

    @Column({nullable: true})
    address: string

    @Column({nullable: true})
    gst: string

    @Column({nullable: true})
    billing_cycle: string

    @Column({nullable: true, default: false})
    is_discount_applicable: boolean

    @Column({default: 0})
    discount_on_waiting_charges: number

    @Column({default: 0})
    discount_on_freight_charges: number

    @Column({default: 0})
    dead_miles_price: number

    @Column({default: false})
    is_regular: boolean

    @Column({default: false})
    is_waiting_charges_include: boolean

    @Column({default: false}) // driver wise limit to 2900
    has_daily_limit: boolean

    @Column({nullable: true})
    bap_id: string

    @Column({nullable: true, default: 'No'})
    is_otp_enabled: string

    @Column({nullable: true, default: 'No'})
    is_delivery_proof_enabled: string
}