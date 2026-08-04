import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('invoice_details')
export class InvoiceDetailsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    invoice_number: string

    @Column({nullable: true})
    invoice_file: string

    @Column({nullable: true})
    bookings: string

    @Column({nullable: true})
    invoice_date: string

    @Column({nullable: true})
    invoice_amount: number

    @Column({nullable: true})
    paid_amount: number

    @Column({nullable: true})
    part_amount: number

    @Column({nullable: true})
    comments: string

    @Column({nullable: true})
    trip_file: string

    @Column({nullable: true})
    waiting_trip_file: string

    @Column({nullable: true})
    company_name: string

    @Column({nullable: true})
    payment_status: string

    @Column({nullable: true})
    invoiceType: string

    @Column({nullable: true})
    notes: string

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date

}