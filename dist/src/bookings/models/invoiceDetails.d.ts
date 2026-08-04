export declare class InvoiceDetailsEntity {
    id: number;
    invoice_number: string;
    invoice_file: string;
    bookings: string;
    invoice_date: string;
    invoice_amount: number;
    paid_amount: number;
    part_amount: number;
    comments: string;
    trip_file: string;
    waiting_trip_file: string;
    company_name: string;
    payment_status: string;
    invoiceType: string;
    notes: string;
    created_at: Date;
    updated_at: Date;
}
