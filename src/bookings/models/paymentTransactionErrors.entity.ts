import { Point } from "geojson";
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity('payment_transaction_errors')
export class PaymentTransactionErrorsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    payment_data: string

    @Column({nullable: true})
    message: string

    @CreateDateColumn()
    created_at: Date

    @CreateDateColumn()
    updated_at: Date

}