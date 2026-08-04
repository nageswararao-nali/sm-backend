import { UtilsService } from 'src/utils/services/utils.service';
import { LocationsEntity } from '../models/locations.entity';
import { DriverService } from '../services/driver.service';
import { LocationService } from '../services/location.service';
export declare class LocationController {
    private locService;
    private utilSerive;
    private driverSerive;
    constructor(locService: LocationService, utilSerive: UtilsService, driverSerive: DriverService);
    getAll(): Promise<LocationsEntity[]>;
    createLocation(location: LocationsEntity): void;
    addDriverLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    saveDriverLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateLatestLocationToBaseLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getRange(location: {
        lat: number;
        long: number;
        range: number;
    }): Promise<any[]>;
    getDriversLocations(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverLocations(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverLocationsByDate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDriverLocationsDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    sessionReports(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverReports(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    daySummaryReports(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    revenueCalculation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    waitingChargeNotesUpdatesManual(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    revenueCalculationNew(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    revenueCalculationManual(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    revenueCalculationDateRange(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    showSessionDistances(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    driverGPSSummary(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcWaitingChargeTest(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverDistanceFromToTimes(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcOSMTwoPoints(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcOSMMapMatching(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateBookingTimes(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateTourStatus(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverSessionDistanceManual(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDistanceFromPoint(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverGoogleDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverGoogleMapMatchDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getHomeDeliveryFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getHomeDeliveryFareByAddresses(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDelhiHomeDeliveryFareByAddresses(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getHomeDeliveryFareByAddressesTest(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getMultiBookingFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getLoadingFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverGoogleMapMatchDistanceNew(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverGoogleMapMatchDistanceWithSpeedTime(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcDriverGoogleMapMatchDistanceWithSpeed(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcGoogleTourDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCustomerCompanyDetails(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getCustomerAddressEditList(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    reCalculateHomeDeliveryFareByDate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkSourceLocation(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getBookingDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcGoogleMapDistanceWithLatlongs(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    compareDriverLocationWhenTourUpdate(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    updateMultiBookingFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    deliverBooking(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    getDelhiHomeDeliveryFreeFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    feedCompanyRates(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    checkToll(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calGenFare(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    standaredRevenueCalculationDateRange(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    calcTourDistance(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    compareBookingDistance(reqBody: any): Promise<any>;
    findTourDistancesByTourIds(reqBody: any): Promise<any>;
    getMetrics(reqBody: any): Promise<any>;
    revenueCalculationDateRangeMetrics(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
    revenueCalculationTocompareFaresDateRange(reqBody: any): Promise<{
        success: boolean;
        data: {};
        message: string;
    }>;
}
