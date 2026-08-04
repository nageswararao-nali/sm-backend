import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('driver_transactions')
export class DriverTransactionsEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: true})
    driver_id: number

    @Column({nullable: true})
    user_id: number

    @Column({nullable: true})
    driver_name: string
	
    @Column({nullable: true})
    transaction_date: string
	
    @Column({nullable: true})
    transaction_date_time: string
	
    @Column({default: 0})
    amount: number

    @Column({default: 0})
    balance: number

    @Column({nullable: true})
    transaction_type: string

    @Column({nullable: true})
    notes: string

    @Column({nullable: true})
    ref_file: string
	
    @CreateDateColumn()
    created_at: Date
}