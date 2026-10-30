import { AdminService } from 'src/admin/services/admin.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { BookingService } from '../services/booking.service';
export declare class BookingController {
    private bookingService;
    private adminService;
    private utilService;
    constructor(bookingService: BookingService, adminService: AdminService, utilService: UtilsService);
    addBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addMultiBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    acceptDispatch(reqBody: any): Promise<any>;
    declineDispatch(reqBody: any): Promise<any>;
    rebroadcastDispatch(reqBody: any): Promise<any>;
    updateBooking(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteBooking(id: number, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteMultiBooking(id: string, reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookings(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getLiveBookings(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getTodayBookings(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingsDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    acceptBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    confirmBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tbeBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tbeBocancelByManageroking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    cancelByCustomer(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    rejectFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    markTrip(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDistanceToCC(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDistanceToCCByGoogle(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addTrip(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getTrips(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getPendingTrips(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteTrip(id: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingsReport(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingDCNumber(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingDCNumberFromManager(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingWaitingCharge(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingTime(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    uploadOdometer(reqBody: any, file: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addShopBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCCavenueSession(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCCavenueResponse(reqBody: any, res: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingPaymentStatus(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    exportInvoiceBookingsCsv(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    exportInvoiceHomeDeliveryBookingsCsv(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getMinlBookingsByCustomer(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getInvoiceBookingsByCompanyId(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    generateInvoiceByCompanyId(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getInvoices(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateInvoiceData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    regenerateInvoiceById(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    downloadInvoiceFiles(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    generateCompanyInvoiceByTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    declineBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getMinlBookingPayDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingPayDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingPayDetailsByMultiId(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    customerBookingLog(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getGMCCavenueResponse(reqBody: any, res: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    bookingTimesBackup(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    genCSV(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverDaySummary(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverDaySummaryManuel(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    testPaymentLinkSMS(reqBody: any): Promise<any>;
    getBookingsByDate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkDrivers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
