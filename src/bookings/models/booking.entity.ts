import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('bookings')
export class BookingEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    customer_id: number

    @Column()
    engaged_consolidation_manager: number

    @Column({nullable: true})
    pickup_location: string

    @Column()
    pickup_time: string

    @Column()
    pickuptime_flexiblity_status: string

    @Column({nullable: true})
    pickup_flexible_time: string

    @Column({nullable: true})
    dropoff_location: string

    @Column({nullable: true})
    dropoff_time: string

    @Column({nullable: true})
    dropofftime_flexiblity_status: string

    @Column({nullable: true})
    dropoff_flexible_time: string

    @Column()
    commodity_type: number

    @Column({nullable: true})
    other_commodity_name: string
    
    @Column({nullable: true, type: 'float'})
    commodity_weight: string
    
    @Column({nullable: true})
    weight_unit: number
    
    @Column({nullable: true})
    commodity_whole_volume: string
    
    @Column({nullable: true})
    volume_unit: number

    @Column({nullable: true})
    commodity_length: number

    @Column({nullable: true})
    length_unit: number

    @Column({nullable: true})
    commodity_breadth: number

    @Column({nullable: true})
    breadth_unit: number

    @Column({nullable: true})
    commodity_height: number

    @Column({nullable: true})
    height_unit: number

    @Column({nullable: true})
    packaging_type: number

    @Column({nullable: true})
    consignment_image: string

    @Column({nullable: true, default: 0})
    quotation_status: number

    @Column({nullable: true, default: 0})
    quotation_payment_status: number

    @Column({nullable: true, default: 0})
    booking_confirm_status: number

    @Column({nullable: true})
    receiver_name: string

    @Column({nullable: true})
    receiver_contact: string

    @Column({nullable: true})
    instruction: string

    @Column({nullable: true})
    status: string

    @Column({nullable: true})
    tour_status: string

    @Column({nullable: true, default: 0})
    assign_tour_status: number
	
    @Column({nullable: true, default: 0})
    assign_tour_status_graph: number
	
    @Column({nullable: true, default: 0})
    at_consolidation_center: number
	
    @Column({nullable: true, default: 0})
    booking_canceled_by_customer: number
	
    @Column({nullable: true, default: 0})
    booking_canceled_by_manager: number

    @Column({default: false})
    marked_as_trip: boolean
    
    @Column({nullable: true, type: 'float'})
    pickup_lat: string
	
    @Column({nullable: true, type: 'float'})
    pickup_long: string
	
    @Column({nullable: true})
    pickup_city: string
	
    @Column({nullable: true})
    pickup_state: string
	
    @Column({nullable: true})
    pickup_pincode: string
	
    @Column({nullable: true})
    pickup_country: string
	
    @Column({nullable: true})
    dropoff_city: string
	
    @Column({nullable: true})
    dropoff_state: string
	
    @Column({nullable: true})
    dropoff_pincode: string
	
    @Column({nullable: true})
    dropoff_country: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_lat: string
	
    @Column({nullable: true, type: 'float'})
    dropoff_long: string
	
    @Column({nullable: true, default: 0})
    booking_accept_status: number

    @Column({nullable: true})
    fare: string

    @Column({nullable: true})
    waiting_charge: string

    @Column({nullable: true})
    reached_pickup: string

    @Column({nullable: true})
    completed_pickup: string

    @Column({nullable: true})
    reached_drop: string

    @Column({nullable: true})
    completed_drop: string

    @Column({nullable: true, default: 0})
    waiting_time: number

    @Column({nullable: true})
    total_distance: string

    @Column({default: false})
    is_closed_booking: boolean

    @Column({default: false})
    is_manager_entered: boolean

    @Column({nullable: true})
    customer_name: string

    @Column({nullable: true})
    driver_name: string

    @Column({nullable: true})
    driver_mobile: string

    @Column({nullable: true})
    vehicle_number: string

    @Column({nullable: true})
    booking_status: string

    @Column({default: false})
    is_having_loading_charges: boolean

    @Column({default: 0})
    loading_charge: number

    @Column()
    created_by: number

    @CreateDateColumn()
    created_at: Date

    @Column({nullable: true})
    updated_by: number

    @CreateDateColumn()
    updated_at: Date

    @Column({nullable: true})
    booking_type: string

    @Column({nullable: true})
    vehicle_type: string

    @Column({nullable: true})
    payment_type: string

    @Column({nullable: true})
    payment_made_by: string

    @Column({nullable: true})
    payment_status: string

    @Column({nullable: true})
    pickup_receiver_contact: string

    @Column({nullable: true})
    pickup_receiver_name: string

    @Column({nullable: true})
    dropoff_receiver_contact: string

    @Column({nullable: true})
    dropoff_receiver_name: string

    @Column({nullable: true, default: 'Immediate'})
    time_interval: string
    
    @Column({nullable: true,  default:  0})
    pickup_address_id: number

    @Column({nullable: true,  default:  0})
    dropoff_address_id: number

    @Column({default: true})
    is_vivegam: boolean

    @Column({nullable: true})
    booking_for: string

    @Column({nullable: true})
    trip_type: string
    
    @Column({nullable: true})
    estimated_fare: string

    @Column({nullable: true})
    shop_id: number

    @Column({default: false})
    is_invoice_generated: boolean

    @Column({nullable: true})
    invoice_number: string

    @Column({default: false})
    loading_charge_applicable: boolean

    @Column({default: false})
    unloading_charge_applicable: boolean

    @Column({default: false})
    both_loading_unloading_charge_applicable: boolean

    @Column({nullable: true, default: 0})
    toll_charges: number

    @Column({nullable: true})
    multi_booking_id: string

    @Column({nullable: true})
    estimate_fare_info: string

    @Column({nullable: true, default: 0})
    additional_fare: string

    @Column({nullable: true})
    additional_fare_comments: string

    @Column({nullable: true, default: 0})
    total_fare: string

    @Column({nullable: true, default: 0})
    total_booking_fare: string

    @Column({nullable: true, default: 0})
    amount_collected: string

    @Column({nullable: true})
    dcNumber: string
    
    @Column({nullable: true})
    tdcNumber: string

    @Column({default: false})
    is_full_payment: boolean

    @Column({default: false})
    is_regular: boolean

    @Column({default: 'pickup'})
    payment_at: string

    @Column({default: false})
    is_booking_from_app: boolean

    @Column({default: false})
    is_manager_updated_tour: boolean
    
    @Column({nullable: true})
    waiting_charge_notes: string

    @Column({type: 'json', nullable: true})
    requestInfo: object
}


	 
	