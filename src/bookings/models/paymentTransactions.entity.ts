import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('payment_transactions')
export class PaymentTransactionsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    amount: string

    @Column()
    order_id: string

    @Column()
    tracking_id: string

    @Column()
    bank_ref_no: string

    @Column()
    payment_mode: string

    @Column()
    card_name: string

    @Column()
    transaction_date: string

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date

}