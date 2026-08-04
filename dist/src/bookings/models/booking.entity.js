"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingEntity = void 0;
const typeorm_1 = require("typeorm");
let BookingEntity = class BookingEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BookingEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BookingEntity.prototype, "customer_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BookingEntity.prototype, "engaged_consolidation_manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_location", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickuptime_flexiblity_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_flexible_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropofftime_flexiblity_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_flexible_time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BookingEntity.prototype, "commodity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "other_commodity_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "commodity_weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "weight_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "commodity_whole_volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "volume_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "commodity_length", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "length_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "commodity_breadth", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "breadth_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "commodity_height", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "height_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "packaging_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "consignment_image", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "quotation_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "quotation_payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "booking_confirm_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "receiver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "receiver_contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "instruction", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "tour_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "assign_tour_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "assign_tour_status_graph", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "at_consolidation_center", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "booking_canceled_by_customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "booking_canceled_by_manager", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "marked_as_trip", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_long", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_city", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_pincode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_country", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'float' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_long", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "booking_accept_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "waiting_charge", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "reached_pickup", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "completed_pickup", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "reached_drop", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "completed_drop", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "waiting_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "total_distance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_closed_booking", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_manager_entered", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "customer_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "driver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "driver_mobile", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "vehicle_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "booking_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_having_loading_charges", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "loading_charge", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BookingEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookingEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "updated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookingEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "booking_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "vehicle_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "payment_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "payment_made_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_receiver_contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "pickup_receiver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_receiver_contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dropoff_receiver_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 'Immediate' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "time_interval", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "pickup_address_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "dropoff_address_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_vivegam", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "booking_for", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "trip_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "estimated_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "shop_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_invoice_generated", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "invoice_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "loading_charge_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "unloading_charge_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "both_loading_unloading_charge_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", Number)
], BookingEntity.prototype, "toll_charges", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "multi_booking_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "estimate_fare_info", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", String)
], BookingEntity.prototype, "additional_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "additional_fare_comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", String)
], BookingEntity.prototype, "total_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", String)
], BookingEntity.prototype, "total_booking_fare", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0 }),
    __metadata("design:type", String)
], BookingEntity.prototype, "amount_collected", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "dcNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "tdcNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_full_payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_regular", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pickup' }),
    __metadata("design:type", String)
], BookingEntity.prototype, "payment_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_booking_from_app", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], BookingEntity.prototype, "is_manager_updated_tour", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingEntity.prototype, "waiting_charge_notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BookingEntity.prototype, "requestInfo", void 0);
BookingEntity = __decorate([
    (0, typeorm_1.Entity)('bookings')
], BookingEntity);
exports.BookingEntity = BookingEntity;
//# sourceMappingURL=booking.entity.js.map