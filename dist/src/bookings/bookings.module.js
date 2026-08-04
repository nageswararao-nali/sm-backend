"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_module_1 = require("../admin/admin.module");
const consolidationCenters_entity_1 = require("../admin/models/consolidationCenters.entity");
const admin_service_1 = require("../admin/services/admin.service");
const tourAssignTruckDrivers_entity_1 = require("../tours/models/tourAssignTruckDrivers.entity");
const tourBookingDetails_entity_1 = require("../tours/models/tourBookingDetails.entity");
const tourRoute_entity_1 = require("../tours/models/tourRoute.entity");
const deliveryProof_entity_1 = require("../tours/models/deliveryProof.entity");
const tours_entity_1 = require("../tours/models/tours.entity");
const cusomerCompanyDetails_1 = require("../trucks/models/cusomerCompanyDetails");
const driver_entity_1 = require("../trucks/models/driver.entity");
const driverSessions_entity_1 = require("../trucks/models/driverSessions.entity");
const truck_entity_1 = require("../trucks/models/truck.entity");
const customerAddress_entity_1 = require("../users/models/customerAddress.entity");
const notifications_entity_1 = require("../users/models/notifications.entity");
const users_entity_1 = require("../users/models/users.entity");
const users_service_1 = require("../users/services/users.service");
const categories_entity_1 = require("../utils/models/categories.entity");
const utils_service_1 = require("../utils/services/utils.service");
const utils_module_1 = require("../utils/utils.module");
const booking_controller_1 = require("./controllers/booking.controller");
const booking_entity_1 = require("./models/booking.entity");
const bookingConsolidationCenters_entity_1 = require("./models/bookingConsolidationCenters.entity");
const bookingStatus_entity_1 = require("./models/bookingStatus.entity");
const trip_entity_1 = require("./models/trip.entity");
const booking_service_1 = require("./services/booking.service");
const shop_entity_1 = require("../trucks/models/shop.entity");
const driverSessionDistance_entity_1 = require("../trucks/models/driverSessionDistance.entity");
const baseLocations_entity_1 = require("../admin/models/baseLocations.entity");
const portalSettings_entity_1 = require("../admin/models/portalSettings.entity");
const invoiceDetails_1 = require("./models/invoiceDetails");
const invoiceNumber_1 = require("./models/invoiceNumber");
const gmRates_1 = require("../trucks/models/gmRates");
const deletedBookings_entity_1 = require("./models/deletedBookings.entity");
const pendingBookings_1 = require("./models/pendingBookings");
const specialAddress_entity_1 = require("../users/models/specialAddress.entity");
const customerBookingLogs_1 = require("./models/customerBookingLogs");
const paymentTransactions_entity_1 = require("./models/paymentTransactions.entity");
const paymentTransactionErrors_entity_1 = require("./models/paymentTransactionErrors.entity");
const bdookingTimeBackup_1 = require("./models/bdookingTimeBackup");
const locations_entity_1 = require("../trucks/models/locations.entity");
const driverLastLocDetails_1 = require("../trucks/models/driverLastLocDetails");
const tours_module_1 = require("../tours/tours.module");
const trucks_module_1 = require("../trucks/trucks.module");
let BookingsModule = class BookingsModule {
};
BookingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([booking_entity_1.BookingEntity, bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity, consolidationCenters_entity_1.ConsolidationCenterEntity,
                users_entity_1.UsersEntity, trip_entity_1.TripEntity, bookingStatus_entity_1.BookingStatusEntity, customerAddress_entity_1.CustomerAddressEntity, categories_entity_1.CategoriesEntity, driver_entity_1.DriversEntity,
                tourRoute_entity_1.TourRouteEntity,
                driverSessions_entity_1.DriverSessionsEntity,
                notifications_entity_1.NotificationsEntity,
                tours_entity_1.ToursEntity,
                truck_entity_1.TrucksEntity,
                tourBookingDetails_entity_1.TourBookingDetailsEntity,
                tourAssignTruckDrivers_entity_1.TourAssignTruckDriversEntity,
                cusomerCompanyDetails_1.CustomerCompanyEntity,
                shop_entity_1.ShopsEntity,
                driverSessionDistance_entity_1.DriverSessionDistanceEntity,
                baseLocations_entity_1.BaseLocationsEntity,
                invoiceDetails_1.InvoiceDetailsEntity,
                invoiceNumber_1.InvoiceNumberEntity, gmRates_1.RateDetailsEntity, deletedBookings_entity_1.DeletedBookingsEntity, pendingBookings_1.PendingBookingEntity,
                specialAddress_entity_1.SpecialAddressEntity, customerBookingLogs_1.CustomerBookingLogsEntity, paymentTransactions_entity_1.PaymentTransactionsEntity, paymentTransactionErrors_entity_1.PaymentTransactionErrorsEntity,
                bdookingTimeBackup_1.BookingTimeBackupEntity,
                locations_entity_1.LocationsEntity,
                driverLastLocDetails_1.DriverLastLocationDetails,
                deliveryProof_entity_1.DeliveryProofEntity,
                portalSettings_entity_1.PortalSettingsEntity
            ]),
            admin_module_1.AdminModule,
            utils_module_1.UtilsModule,
            axios_1.HttpModule,
            (0, common_1.forwardRef)(() => tours_module_1.ToursModule),
            trucks_module_1.TrucksModule
        ],
        controllers: [booking_controller_1.BookingController],
        providers: [
            booking_service_1.BookingService, booking_entity_1.BookingEntity, bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity, admin_service_1.AdminService,
            consolidationCenters_entity_1.ConsolidationCenterEntity, users_service_1.UsersService, users_entity_1.UsersEntity, trip_entity_1.TripEntity, bookingStatus_entity_1.BookingStatusEntity,
            utils_service_1.UtilsService, tours_entity_1.ToursEntity, truck_entity_1.TrucksEntity, tourBookingDetails_entity_1.TourBookingDetailsEntity, tourAssignTruckDrivers_entity_1.TourAssignTruckDriversEntity,
            cusomerCompanyDetails_1.CustomerCompanyEntity, shop_entity_1.ShopsEntity, driverSessionDistance_entity_1.DriverSessionDistanceEntity, invoiceDetails_1.InvoiceDetailsEntity, invoiceNumber_1.InvoiceNumberEntity,
            gmRates_1.RateDetailsEntity, deletedBookings_entity_1.DeletedBookingsEntity, pendingBookings_1.PendingBookingEntity, specialAddress_entity_1.SpecialAddressEntity, customerBookingLogs_1.CustomerBookingLogsEntity, bdookingTimeBackup_1.BookingTimeBackupEntity
        ],
        exports: [booking_entity_1.BookingEntity, bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity, trip_entity_1.TripEntity, booking_service_1.BookingService]
    })
], BookingsModule);
exports.BookingsModule = BookingsModule;
//# sourceMappingURL=bookings.module.js.map