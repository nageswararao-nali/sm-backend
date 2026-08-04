import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('invoice_number')
export class InvoiceNumberEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    invoice_number: number

    @Column({nullable: true})
    invoice_date: string

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date

}
