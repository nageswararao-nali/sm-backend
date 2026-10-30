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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("../../admin/services/admin.service");
const utils_service_1 = require("../../utils/services/utils.service");
const booking_service_1 = require("../services/booking.service");
const platform_express_1 = require("@nestjs/platform-express");
let BookingController = class BookingController {
    constructor(bookingService, adminService, utilService) {
        this.bookingService = bookingService;
        this.adminService = adminService;
        this.utilService = utilService;
    }
    async addBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        };
        const cData = await this.adminService.getNearestCC({ lat: reqBody.pickup_lat, long: reqBody.pickup_long });
        if (cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id);
            reqBody['engaged_consolidation_manager'] = ccManagerId;
            const booking = await this.bookingService.addBooking(reqBody);
            if (!booking) {
                response.success = false;
                response.message = "Problem in saving booking";
            }
            else {
                response.data = booking;
            }
        }
        else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response;
    }
    async addMultiBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        };
        const cData = await this.adminService.getNearestCC({ lat: reqBody.pickup[0].pickup_lat, long: reqBody.pickup[0].pickup_long });
        if (cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id);
            reqBody['engaged_consolidation_manager'] = ccManagerId;
            const booking = await this.bookingService.addMultiBooking(reqBody);
            if (!booking.length) {
                response.success = false;
                response.message = "Problem in saving booking";
            }
            else {
                response.data = booking;
            }
        }
        else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response;
    }
    async acceptDispatch(reqBody) {
        return await this.bookingService.acceptDispatch(reqBody);
    }
    async declineDispatch(reqBody) {
        return await this.bookingService.declineDispatch(reqBody);
    }
    async rebroadcastDispatch(reqBody) {
        return await this.bookingService.rebroadcastDispatch(reqBody);
    }
    async updateBooking(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Updated Successfully'
        };
        const cData = await this.adminService.getNearestCC({ lat: reqBody.pickup_lat, long: reqBody.pickup_long });
        if (cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id);
            reqBody['engaged_consolidation_manager'] = ccManagerId;
            const booking = await this.bookingService.updateBooking(id, reqBody);
            if (!booking) {
                response.success = false;
                response.message = "Problem in updating booking";
            }
            else {
                response.data = booking;
            }
        }
        else {
            response.success = false;
            response.message = "Problem in updating consolidation manager booking";
        }
        return response;
    }
    async deleteBooking(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Deleted Successfully'
        };
        const booking = await this.bookingService.deleteBooking(id);
        if (!booking) {
            response.success = false;
            response.message = "Problem in updating booking";
        }
        else {
            response.data = booking;
        }
        return response;
    }
    async deleteMultiBooking(id, reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Deleted Successfully'
        };
        const booking = await this.bookingService.deleteMultiBooking(id);
        if (!booking) {
            response.success = false;
            response.message = "Problem in updating booking";
        }
        else {
            response.data = booking;
        }
        return response;
    }
    async getBookings(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const { items, count } = await this.bookingService.getBookings(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: items, count };
        }
        return response;
    }
    async getLiveBookings(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const { items, count } = await this.bookingService.getLiveBookings(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: items, count };
        }
        return response;
    }
    async getTodayBookings(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const { items, count } = await this.bookingService.getTodayBookings(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: items, count };
        }
        return response;
    }
    async getBookingsDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Details'
        };
        const bookings = await this.bookingService.getBookingsDetails(reqBody);
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: bookings };
        }
        return response;
    }
    async getBookingDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking found'
        };
        const bookingData = await this.bookingService.getBookingById(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async acceptBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.acceptBooking(reqBody.booking_id, reqBody.fare);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async confirmBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Confirmed Successfully'
        };
        const bookingData = await this.bookingService.confirmBooking(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async tbeBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.tbeBooking(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async tbeBocancelByManageroking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled Successfully'
        };
        const bookingData = await this.bookingService.cancelByManager(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async cancelByCustomer(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled by Customer'
        };
        const bookingData = await this.bookingService.cancelByCustomer(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async rejectFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled by Customer'
        };
        const bookingData = await this.bookingService.cancelByCustomer(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async markTrip(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking marked as Trip'
        };
        const bookingData = await this.bookingService.getBookingById(reqBody.booking_id);
        if (!bookingData) {
            response.success = false;
            response.message = "Invalid booking Id";
        }
        else {
            bookingData['booking_id'] = bookingData.id;
            bookingData['trip_id'] = bookingData.id;
            const tripData = await this.bookingService.addTrip(bookingData);
            if (!tripData) {
                response.success = false;
                response.message = "Problem in marking as trip";
            }
            else {
                response.data = tripData;
            }
        }
        return response;
    }
    async getDistanceToCC(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const cData = await this.adminService.getDistanceToCC({ lat: reqBody.lat, long: reqBody.long, ccId: reqBody.ccId });
        if (!cData) {
            response.success = false;
            response.message = "Problem in finding distance";
        }
        else {
            response.data = cData;
        }
        return response;
    }
    async getDistanceToCCByGoogle(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const distanceData = await this.utilService.getDistance({ lat: reqBody.pickup_lat, long: reqBody.pickup_long }, { lat: reqBody.dropoff_lat, long: reqBody.dropoff_long });
        if (distanceData.status == 'OK') {
            const data = distanceData.rows[0] ? distanceData.rows[0].elements[0] : null;
            response.data = data;
        }
        else {
            response.success = false;
            response.message = distanceData.status;
        }
        return response;
    }
    async addTrip(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Trip Added Successfully'
        };
        const tripData = await this.bookingService.addTrip(reqBody);
        if (!tripData) {
            response.success = false;
            response.message = "Problem in adding trip";
        }
        else {
            response.data = tripData;
        }
        return response;
    }
    async getTrips(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Trips Found'
        };
        const { items, count } = await this.bookingService.getTrips(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Trips not found";
        }
        else {
            response.data = { trips: items, count };
        }
        return response;
    }
    async getPendingTrips(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Trips Found'
        };
        const { items, count } = await this.bookingService.getPendingTrips(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Trips not found";
        }
        else {
            response.data = { trips: items, count };
        }
        return response;
    }
    async deleteTrip(id) {
        let response = {
            success: true,
            data: {},
            message: 'Trip Deleted Successfully'
        };
        const tripData = await this.bookingService.deleteTrip(id);
        if (!tripData) {
            response.success = false;
            response.message = "Problem in deleting trip";
        }
        else {
            response.data = tripData;
        }
        return response;
    }
    async getBookingsReport(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Details'
        };
        const bookings = await this.bookingService.getBookingsReport(reqBody);
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: bookings };
        }
        return response;
    }
    async updateBookingFare(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.updateBookingFare(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async updateBookingDCNumber(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.updateBookingDCNumber(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async updateBookingDCNumberFromManager(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.updateBookingDCNumberFromManager(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async updateBookingWaitingCharge(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.updateBookingWaitingCharge(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async updateBookingTime(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.updateBookingTime(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async uploadOdometer(reqBody, file) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const odometerUpload = await this.bookingService.uploadReceipt(file, reqBody.customer_mobile);
        if (!odometerUpload) {
            response.success = false;
            response.message = "Receipt with customer id " + reqBody.customer_mobile + " not found";
        }
        else {
            response.data = odometerUpload;
        }
        return response;
    }
    async addShopBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        };
        const cData = await this.adminService.getNearestCC({ lat: reqBody.pickup_lat, long: reqBody.pickup_long });
        if (cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id);
            reqBody['engaged_consolidation_manager'] = ccManagerId;
            const booking = await this.bookingService.addShopBooking(reqBody);
            if (!booking) {
                response.success = false;
                response.message = "Problem in saving shop booking";
            }
            else {
                response.data = booking;
            }
        }
        else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response;
    }
    async getCCavenueSession(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getCCavenueSession(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getCCavenueResponse(reqBody, res) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getCCavenueResponse(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            res.redirect(bookingData);
        }
        return response;
    }
    async updateBookingPaymentStatus(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.updateBookingPaymentStatus(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async exportInvoiceBookingsCsv(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.exportInvoiceBookingsCsv(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async exportInvoiceHomeDeliveryBookingsCsv(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.exportInvoiceHomeDeliveryBookingsCsv(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getMinlBookingsByCustomer(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const { items, count } = await this.bookingService.getMinlBookingsByCustomer(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: items, count };
        }
        return response;
    }
    async getInvoiceBookingsByCompanyId(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const { items, count } = await this.bookingService.getInvoiceBookingsByCompanyId(reqBody);
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: items, count };
        }
        return response;
    }
    async generateInvoiceByCompanyId(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const res = await this.bookingService.generateInvoiceByCompanyId(reqBody);
        if (!res) {
            response.success = false;
            response.message = "";
        }
        else {
            response.data = {};
        }
        return response;
    }
    async getInvoices(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded invoices successfully'
        };
        const { items, count } = await this.bookingService.getInvoices(reqBody);
        if (!items) {
            response.success = false;
            response.message = count;
        }
        else {
            response.data = { invoices: items, count };
        }
        return response;
    }
    async updateInvoiceData(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.updateInvoiceData(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async regenerateInvoiceById(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.regenerateInvoiceById(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async downloadInvoiceFiles(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const bookingData = await this.bookingService.downloadInvoiceFiles(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async generateCompanyInvoiceByTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const res = await this.bookingService.generateCompanyInvoiceByTour(reqBody);
        if (!res) {
            response.success = false;
            response.message = '';
        }
        else {
            response.data = {};
        }
        return response;
    }
    async declineBooking(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.declineBooking(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getMinlBookingPayDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getMinlBookingPayDetails(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getBookingPayDetails(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getBookingPayDetails(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getBookingPayDetailsByMultiId(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getBookingPayDetailsByMultiId(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async customerBookingLog(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.customerBookingLog(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async getGMCCavenueResponse(reqBody, res) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.getGMCCavenueResponse(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            res.redirect(bookingData);
        }
        return response;
    }
    async bookingTimesBackup(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.bookingTimesBackup(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async genCSV(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        };
        const bookingData = await this.bookingService.genCSV();
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async driverDaySummary(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Drivers Day Summary sent Successfully'
        };
        const bookingData = await this.bookingService.driverDaySummary(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async driverDaySummaryManuel(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Drivers Day Summary sent Successfully'
        };
        const bookingData = await this.bookingService.driverDaySummaryManuel(reqBody);
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        }
        else {
            response.data = bookingData;
        }
        return response;
    }
    async testPaymentLinkSMS(reqBody) {
        const response = await this.bookingService.testPaymentLinkSMS();
        return response;
    }
    async getBookingsByDate(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const bookings = await this.bookingService.getBookingsByDate(reqBody);
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: bookings };
        }
        return response;
    }
    async checkDrivers(reqBody) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        };
        const bookings = await this.bookingService.checkDrivers(reqBody);
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        }
        else {
            response.data = { bookings: bookings };
        }
        return response;
    }
};
__decorate([
    (0, common_1.Post)('addBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "addBooking", null);
__decorate([
    (0, common_1.Post)('addMultiBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "addMultiBooking", null);
__decorate([
    (0, common_1.Post)('acceptDispatch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "acceptDispatch", null);
__decorate([
    (0, common_1.Post)('declineDispatch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "declineDispatch", null);
__decorate([
    (0, common_1.Post)('rebroadcastDispatch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "rebroadcastDispatch", null);
__decorate([
    (0, common_1.Post)('updateBooking/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Post)('deleteBooking/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "deleteBooking", null);
__decorate([
    (0, common_1.Post)('deleteMultiBooking/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "deleteMultiBooking", null);
__decorate([
    (0, common_1.Post)('getBookings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Post)('getLiveBookings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getLiveBookings", null);
__decorate([
    (0, common_1.Post)('getTodayBookings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getTodayBookings", null);
__decorate([
    (0, common_1.Post)('getBookingsDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingsDetails", null);
__decorate([
    (0, common_1.Post)('getBookingDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingDetails", null);
__decorate([
    (0, common_1.Post)('acceptBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "acceptBooking", null);
__decorate([
    (0, common_1.Post)('confirmBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Post)('tbeBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "tbeBooking", null);
__decorate([
    (0, common_1.Post)('cancelByManager'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "tbeBocancelByManageroking", null);
__decorate([
    (0, common_1.Post)('cancelByCustomer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "cancelByCustomer", null);
__decorate([
    (0, common_1.Post)('rejectFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "rejectFare", null);
__decorate([
    (0, common_1.Post)('markTrip'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "markTrip", null);
__decorate([
    (0, common_1.Post)('getDistanceToCC'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getDistanceToCC", null);
__decorate([
    (0, common_1.Post)('getDistanceToCCBygoogle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getDistanceToCCByGoogle", null);
__decorate([
    (0, common_1.Post)('addTrip'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "addTrip", null);
__decorate([
    (0, common_1.Post)('getTrips'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getTrips", null);
__decorate([
    (0, common_1.Post)('getPendingTrips'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getPendingTrips", null);
__decorate([
    (0, common_1.Post)('deleteTrip/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "deleteTrip", null);
__decorate([
    (0, common_1.Post)('getBookingsReport'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingsReport", null);
__decorate([
    (0, common_1.Post)('updateBookingFare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingFare", null);
__decorate([
    (0, common_1.Post)('updateBookingDCNumber'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingDCNumber", null);
__decorate([
    (0, common_1.Post)('updateBookingDCNumberFromManager'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingDCNumberFromManager", null);
__decorate([
    (0, common_1.Post)('updateBookingWaitingCharge'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingWaitingCharge", null);
__decorate([
    (0, common_1.Post)('updateBookingTime'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingTime", null);
__decorate([
    (0, common_1.Post)('uploadreceipt'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "uploadOdometer", null);
__decorate([
    (0, common_1.Post)('addShopBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "addShopBooking", null);
__decorate([
    (0, common_1.Post)('getCCavenueSession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getCCavenueSession", null);
__decorate([
    (0, common_1.Post)('getCCavenueResponse'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getCCavenueResponse", null);
__decorate([
    (0, common_1.Post)('updateBookingPaymentStatus'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBookingPaymentStatus", null);
__decorate([
    (0, common_1.Post)('exportInvoiceBookingsCsv'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "exportInvoiceBookingsCsv", null);
__decorate([
    (0, common_1.Post)('exportInvoiceHomeDeliveryBookingsCsv'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "exportInvoiceHomeDeliveryBookingsCsv", null);
__decorate([
    (0, common_1.Post)('getMinlBookingsByCustomer'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getMinlBookingsByCustomer", null);
__decorate([
    (0, common_1.Post)('getInvoiceBookingsByCompanyId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getInvoiceBookingsByCompanyId", null);
__decorate([
    (0, common_1.Post)('generateInvoiceByCompanyId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "generateInvoiceByCompanyId", null);
__decorate([
    (0, common_1.Post)('getInvoices'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Post)('updateInvoiceData'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateInvoiceData", null);
__decorate([
    (0, common_1.Post)('regenerateInvoiceById'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "regenerateInvoiceById", null);
__decorate([
    (0, common_1.Post)('downloadInvoiceFiles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "downloadInvoiceFiles", null);
__decorate([
    (0, common_1.Post)('generateCompanyInvoiceByTour'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "generateCompanyInvoiceByTour", null);
__decorate([
    (0, common_1.Post)('declineBooking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "declineBooking", null);
__decorate([
    (0, common_1.Post)('getMinlBookingPayDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getMinlBookingPayDetails", null);
__decorate([
    (0, common_1.Post)('getBookingPayDetails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingPayDetails", null);
__decorate([
    (0, common_1.Post)('getBookingPayDetailsByMultiId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingPayDetailsByMultiId", null);
__decorate([
    (0, common_1.Post)('customerBookingLog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "customerBookingLog", null);
__decorate([
    (0, common_1.Post)('getGMCCavenueResponse'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getGMCCavenueResponse", null);
__decorate([
    (0, common_1.Post)('bookingTimesBackup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "bookingTimesBackup", null);
__decorate([
    (0, common_1.Post)('genCSV'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "genCSV", null);
__decorate([
    (0, common_1.Post)('driverDaySummary'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "driverDaySummary", null);
__decorate([
    (0, common_1.Post)('driverDaySummaryManuel'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "driverDaySummaryManuel", null);
__decorate([
    (0, common_1.Post)('testPaymentLinkSMS'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "testPaymentLinkSMS", null);
__decorate([
    (0, common_1.Post)('getBookingsByDate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBookingsByDate", null);
__decorate([
    (0, common_1.Post)('checkDrivers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "checkDrivers", null);
BookingController = __decorate([
    (0, common_1.Controller)('booking'),
    __metadata("design:paramtypes", [booking_service_1.BookingService, admin_service_1.AdminService, utils_service_1.UtilsService])
], BookingController);
exports.BookingController = BookingController;
//# sourceMappingURL=booking.controller.js.map