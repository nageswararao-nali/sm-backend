"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToursModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const tour_service_1 = require("./services/tour.service");
const tour_controller_1 = require("./controllers/tour.controller");
const tours_entity_1 = require("./models/tours.entity");
const typeorm_1 = require("@nestjs/typeorm");
const tourBookingDetails_entity_1 = require("./models/tourBookingDetails.entity");
const bookings_module_1 = require("../bookings/bookings.module");
const booking_entity_1 = require("../bookings/models/booking.entity");
const bookingConsolidationCenters_entity_1 = require("../bookings/models/bookingConsolidationCenters.entity");
const utils_module_1 = require("../utils/utils.module");
const utils_service_1 = require("../utils/services/utils.service");
const axios_1 = require("@nestjs/axios");
const users_entity_1 = require("../users/models/users.entity");
const categories_entity_1 = require("../utils/models/categories.entity");
const tourAssignTruckDrivers_entity_1 = require("./models/tourAssignTruckDrivers.entity");
const trucks_module_1 = require("../trucks/trucks.module");
const truck_entity_1 = require("../trucks/models/truck.entity");
const driver_entity_1 = require("../trucks/models/driver.entity");
const config_1 = require("@nestjs/config");
const tourRoute_entity_1 = require("./models/tourRoute.entity");
const trip_entity_1 = require("../bookings/models/trip.entity");
const driver_service_1 = require("../trucks/services/driver.service");
const driverSessions_entity_1 = require("../trucks/models/driverSessions.entity");
const truck_service_1 = require("../trucks/services/truck.service");
const users_service_1 = require("../users/services/users.service");
const location_service_1 = require("../trucks/services/location.service");
const customerAddress_entity_1 = require("../users/models/customerAddress.entity");
const locations_entity_1 = require("../trucks/models/locations.entity");
const notifications_entity_1 = require("../users/models/notifications.entity");
const bookingStatus_entity_1 = require("../bookings/models/bookingStatus.entity");
const driverTripFareDetails_1 = require("../trucks/models/driverTripFareDetails");
const cusomerCompanyDetails_1 = require("../trucks/models/cusomerCompanyDetails");
const gmRates_1 = require("../trucks/models/gmRates");
const booking_service_1 = require("../bookings/services/booking.service");
const gmTruckerRates_1 = require("../trucks/models/gmTruckerRates");
const gmTruckerPayments_1 = require("../trucks/models/gmTruckerPayments");
const shop_entity_1 = require("../trucks/models/shop.entity");
const shop_service_1 = require("../trucks/services/shop.service");
const driverSessionDistance_entity_1 = require("../trucks/models/driverSessionDistance.entity");
const baseLocations_entity_1 = require("../admin/models/baseLocations.entity");
const admin_module_1 = require("../admin/admin.module");
const admin_service_1 = require("../admin/services/admin.service");
const consolidationCenters_entity_1 = require("../admin/models/consolidationCenters.entity");
const gmDriverRates_1 = require("../trucks/models/gmDriverRates");
const driverTransactions_1 = require("../trucks/models/driverTransactions");
const invoiceDetails_1 = require("../bookings/models/invoiceDetails");
const invoiceNumber_1 = require("../bookings/models/invoiceNumber");
const deletedBookings_entity_1 = require("../bookings/models/deletedBookings.entity");
const gmVolumeRates_1 = require("../trucks/models/gmVolumeRates");
const pendingBookings_1 = require("../bookings/models/pendingBookings");
const specialAddress_entity_1 = require("../users/models/specialAddress.entity");
const customerBookingLogs_1 = require("../bookings/models/customerBookingLogs");
const paymentTransactions_entity_1 = require("../bookings/models/paymentTransactions.entity");
const paymentTransactionErrors_entity_1 = require("../bookings/models/paymentTransactionErrors.entity");
const seqTrack_1 = require("./models/seqTrack");
const bdookingTimeBackup_1 = require("../bookings/models/bdookingTimeBackup");
const userLogin_entity_1 = require("../users/models/userLogin.entity");
const driverSessionSummary_entity_1 = require("../trucks/models/driverSessionSummary.entity");
const customerAddressRates_entity_1 = require("../trucks/models/customerAddressRates.entity");
const vehicleLiveData_entity_1 = require("./models/vehicleLiveData.entity");
const driverLastLocDetails_1 = require("../trucks/models/driverLastLocDetails");
const redis_module_1 = require("../common/redis/redis.module");
const callLogs_entity_1 = require("./models/callLogs.entity");
const deliveryProof_entity_1 = require("./models/deliveryProof.entity");
const portalSettings_entity_1 = require("../admin/models/portalSettings.entity");
const bookingDispatch_entity_1 = require("../bookings/models/bookingDispatch.entity");
const bookingDispatchCandidate_entity_1 = require("../bookings/models/bookingDispatchCandidate.entity");
let ToursModule = class ToursModule {
};
ToursModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => bookings_module_1.BookingsModule),
            typeorm_1.TypeOrmModule.forFeature([
                tours_entity_1.ToursEntity, tourBookingDetails_entity_1.TourBookingDetailsEntity, booking_entity_1.BookingEntity, bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity,
                users_entity_1.UsersEntity, categories_entity_1.CategoriesEntity,
                tourAssignTruckDrivers_entity_1.TourAssignTruckDriversEntity,
                truck_entity_1.TrucksEntity,
                driver_entity_1.DriversEntity,
                tourRoute_entity_1.TourRouteEntity,
                trip_entity_1.TripEntity,
                driverSessions_entity_1.DriverSessionsEntity,
                customerAddress_entity_1.CustomerAddressEntity,
                locations_entity_1.LocationsEntity,
                notifications_entity_1.NotificationsEntity,
                bookingStatus_entity_1.BookingStatusEntity,
                driverTripFareDetails_1.DriverTripFareDetailsEntity,
                cusomerCompanyDetails_1.CustomerCompanyEntity,
                gmRates_1.RateDetailsEntity,
                gmTruckerRates_1.GMTruckerRatesEntity,
                gmTruckerPayments_1.GMTruckerPaymentsEntity,
                shop_entity_1.ShopsEntity,
                driverSessionDistance_entity_1.DriverSessionDistanceEntity,
                baseLocations_entity_1.BaseLocationsEntity,
                consolidationCenters_entity_1.ConsolidationCenterEntity,
                categories_entity_1.CategoriesEntity,
                gmDriverRates_1.GMDriverRatesEntity,
                driverTransactions_1.DriverTransactionsEntity,
                invoiceDetails_1.InvoiceDetailsEntity,
                invoiceNumber_1.InvoiceNumberEntity,
                deletedBookings_entity_1.DeletedBookingsEntity,
                gmVolumeRates_1.VolumeRateDetailsEntity,
                pendingBookings_1.PendingBookingEntity,
                specialAddress_entity_1.SpecialAddressEntity,
                customerBookingLogs_1.CustomerBookingLogsEntity,
                paymentTransactions_entity_1.PaymentTransactionsEntity,
                paymentTransactionErrors_entity_1.PaymentTransactionErrorsEntity,
                seqTrack_1.SeqTrackEntity,
                bdookingTimeBackup_1.BookingTimeBackupEntity,
                userLogin_entity_1.UserLoginsEntity,
                driverSessionSummary_entity_1.DriverSessionSummaryEntity,
                customerAddressRates_entity_1.CustomerAddressRatesEntity,
                vehicleLiveData_entity_1.VehicleLiveDataEntity,
                driverLastLocDetails_1.DriverLastLocationDetails,
                callLogs_entity_1.CallLogsEntity,
                deliveryProof_entity_1.DeliveryProofEntity,
                portalSettings_entity_1.PortalSettingsEntity,
                bookingDispatch_entity_1.BookingDispatchEntity,
                bookingDispatchCandidate_entity_1.BookingDispatchCandidateEntity
            ]),
            utils_module_1.UtilsModule,
            axios_1.HttpModule,
            trucks_module_1.TrucksModule,
            admin_module_1.AdminModule,
            redis_module_1.RedisModule,
            bullmq_1.BullModule.registerQueue({ name: 'dispatch-timeout' })
        ],
        providers: [
            tour_service_1.TourService, tours_entity_1.ToursEntity, tourBookingDetails_entity_1.TourBookingDetailsEntity, booking_entity_1.BookingEntity,
            bookingDispatch_entity_1.BookingDispatchEntity, bookingDispatchCandidate_entity_1.BookingDispatchCandidateEntity,
            bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity,
            categories_entity_1.CategoriesEntity,
            tourAssignTruckDrivers_entity_1.TourAssignTruckDriversEntity,
            truck_entity_1.TrucksEntity,
            driver_entity_1.DriversEntity,
            tourRoute_entity_1.TourRouteEntity,
            trip_entity_1.TripEntity,
            utils_service_1.UtilsService,
            config_1.ConfigService,
            driver_service_1.DriverService,
            truck_service_1.TruckService,
            location_service_1.LocationService,
            users_service_1.UsersService,
            location_service_1.LocationService,
            customerAddress_entity_1.CustomerAddressEntity,
            driverTripFareDetails_1.DriverTripFareDetailsEntity,
            cusomerCompanyDetails_1.CustomerCompanyEntity,
            gmRates_1.RateDetailsEntity,
            booking_service_1.BookingService,
            shop_service_1.ShopService,
            shop_entity_1.ShopsEntity,
            driverSessionDistance_entity_1.DriverSessionDistanceEntity,
            baseLocations_entity_1.BaseLocationsEntity,
            admin_service_1.AdminService,
            consolidationCenters_entity_1.ConsolidationCenterEntity,
            categories_entity_1.CategoriesEntity,
            invoiceDetails_1.InvoiceDetailsEntity,
            specialAddress_entity_1.SpecialAddressEntity,
            seqTrack_1.SeqTrackEntity,
            vehicleLiveData_entity_1.VehicleLiveDataEntity
        ],
        controllers: [tour_controller_1.TourController],
        exports: [tourRoute_entity_1.TourRouteEntity, tours_entity_1.ToursEntity, tour_service_1.TourService]
    })
], ToursModule);
exports.ToursModule = ToursModule;
//# sourceMappingURL=tours.module.js.map