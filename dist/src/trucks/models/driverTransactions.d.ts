export declare class DriverTransactionsEntity {
    id: number;
    driver_id: number;
    user_id: number;
    driver_name: string;
    transaction_date: string;
    transaction_date_time: string;
    amount: number;
    balance: number;
    transaction_type: string;
    notes: string;
    ref_file: string;
    created_at: Date;
}
