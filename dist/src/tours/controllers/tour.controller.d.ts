import { TourService } from '../services/tour.service';
export declare class TourController {
    private tourService;
    constructor(tourService: TourService);
    tourDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tourFullDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    toursList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    assignTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    startTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    uploadOdometer(reqBody: any, file: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tourDocuments(reqBody: any, file: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendTourOtp(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    verifyTourOtp(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    truckerTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    rejectTour(reqBody: any): Promise<any>;
    addTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateTourDriver(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sendDeliveryOtp(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    completeTourRoute(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateSequence(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updatePaySequence(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    completeTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tourInfo(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deleteSession(id: number): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateTourTrips(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    addClosedTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    callToCustomer(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    callToDriver(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    testExotel(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    testExotelByNumbers(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingTime(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getTourDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    callDriverWhenTourEdit(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    tourDetailsData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    notificationToCustomerAboutDriverWaiting(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverToursList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverBookingsList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkDelayTours(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    test(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkTourSessionTagging(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    cleanDoubleTagged(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    uploadDeliveryProof(reqBody: any, file: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    vehicleLiveDataList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    estimateLiveVehicleData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getEstimatedLiveVehicleData(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    simulateVehicleLiveDataList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    initiateReturn(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverToursByDate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkActiveTour(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
