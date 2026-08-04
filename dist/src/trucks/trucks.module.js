"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrucksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const truck_controller_1 = require("./controllers/truck.controller");
const driver_entity_1 = require("./models/driver.entity");
const driverSessions_entity_1 = require("./models/driverSessions.entity");
const truck_entity_1 = require("./models/truck.entity");
const truck_service_1 = require("./services/truck.service");
const location_controller_1 = require("./controllers/location.controller");
const location_service_1 = require("./services/location.service");
const locations_entity_1 = require("./models/locations.entity");
const driver_controller_1 = require("./controllers/driver.controller");
const driver_service_1 = require("./services/driver.service");
const users_entity_1 = require("../users/models/users.entity");
const users_module_1 = require("../users/users.module");
const users_service_1 = require("../users/services/users.service");
const utils_service_1 = require("../utils/services/utils.service");
const utils_module_1 = require("../utils/utils.module");
const customerAddress_entity_1 = require("../users/models/customerAddress.entity");
const axios_1 = require("@nestjs/axios");
const categories_entity_1 = require("../utils/models/categories.entity");
const tourRoute_entity_1 = require("../tours/models/tourRoute.entity");
const tours_entity_1 = require("../tours/models/tours.entity");
const notifications_entity_1 = require("../users/models/notifications.entity");
const booking_entity_1 = require("../bookings/models/booking.entity");
const trip_entity_1 = require("../bookings/models/trip.entity");
const bookingStatus_entity_1 = require("../bookings/models/bookingStatus.entity");
const config_1 = require("@nestjs/config");
const driverTripFareDetails_1 = require("./models/driverTripFareDetails");
const cusomerCompanyDetails_1 = require("./models/cusomerCompanyDetails");
const gmRates_1 = require("./models/gmRates");
const gmTruckerPayments_1 = require("./models/gmTruckerPayments");
const gmTruckerRates_1 = require("./models/gmTruckerRates");
const shop_entity_1 = require("./models/shop.entity");
const shop_controller_1 = require("./controllers/shop.controller");
const shop_service_1 = require("./services/shop.service");
const driverSessionDistance_entity_1 = require("./models/driverSessionDistance.entity");
const gmDriverRates_1 = require("./models/gmDriverRates");
const baseLocations_entity_1 = require("../admin/models/baseLocations.entity");
const driverTransactions_1 = require("./models/driverTransactions");
const gmVolumeRates_1 = require("./models/gmVolumeRates");
const specialAddress_entity_1 = require("../users/models/specialAddress.entity");
const data_controller_1 = require("./controllers/data.controller");
const data_service_1 = require("./services/data.service");
const userLogin_entity_1 = require("../users/models/userLogin.entity");
const driverSessionSummary_entity_1 = require("./models/driverSessionSummary.entity");
const customerAddressRates_entity_1 = require("./models/customerAddressRates.entity");
const driverLastLocDetails_1 = require("./models/driverLastLocDetails");
let TrucksModule = class TrucksModule {
};
TrucksModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                driver_entity_1.DriversEntity, truck_entity_1.TrucksEntity, driverSessions_entity_1.DriverSessionsEntity, locations_entity_1.LocationsEntity,
                users_entity_1.UsersEntity, customerAddress_entity_1.CustomerAddressEntity, categories_entity_1.CategoriesEntity, tourRoute_entity_1.TourRouteEntity, tours_entity_1.ToursEntity, notifications_entity_1.NotificationsEntity, booking_entity_1.BookingEntity, trip_entity_1.TripEntity,
                bookingStatus_entity_1.BookingStatusEntity, driverTripFareDetails_1.DriverTripFareDetailsEntity, cusomerCompanyDetails_1.CustomerCompanyEntity, gmRates_1.RateDetailsEntity, gmTruckerPayments_1.GMTruckerPaymentsEntity, gmTruckerRates_1.GMTruckerRatesEntity,
                shop_entity_1.ShopsEntity, driverSessionDistance_entity_1.DriverSessionDistanceEntity, gmDriverRates_1.GMDriverRatesEntity, baseLocations_entity_1.BaseLocationsEntity, driverTransactions_1.DriverTransactionsEntity, gmVolumeRates_1.VolumeRateDetailsEntity,
                specialAddress_entity_1.SpecialAddressEntity, userLogin_entity_1.UserLoginsEntity, driverSessionSummary_entity_1.DriverSessionSummaryEntity, customerAddressRates_entity_1.CustomerAddressRatesEntity, driverLastLocDetails_1.DriverLastLocationDetails
            ]),
            users_module_1.UsersModule,
            utils_module_1.UtilsModule,
            axios_1.HttpModule
        ],
        controllers: [truck_controller_1.TruckController, location_controller_1.LocationController, driver_controller_1.DriverController, shop_controller_1.ShopsController, data_controller_1.DataController],
        providers: [
            truck_service_1.TruckService, driver_entity_1.DriversEntity, truck_entity_1.TrucksEntity, driverSessions_entity_1.DriverSessionsEntity,
            location_service_1.LocationService, driver_service_1.DriverService, users_service_1.UsersService, users_entity_1.UsersEntity, utils_service_1.UtilsService, tours_entity_1.ToursEntity, booking_entity_1.BookingEntity, trip_entity_1.TripEntity, data_service_1.DataService,
            bookingStatus_entity_1.BookingStatusEntity, config_1.ConfigService, driverTripFareDetails_1.DriverTripFareDetailsEntity, cusomerCompanyDetails_1.CustomerCompanyEntity, gmRates_1.RateDetailsEntity, gmTruckerPayments_1.GMTruckerPaymentsEntity, gmTruckerRates_1.GMTruckerRatesEntity,
            shop_entity_1.ShopsEntity, shop_service_1.ShopService, driverSessionDistance_entity_1.DriverSessionDistanceEntity, gmDriverRates_1.GMDriverRatesEntity, driverTransactions_1.DriverTransactionsEntity, gmVolumeRates_1.VolumeRateDetailsEntity, specialAddress_entity_1.SpecialAddressEntity,
            driverSessionSummary_entity_1.DriverSessionSummaryEntity, customerAddressRates_entity_1.CustomerAddressRatesEntity, driverLastLocDetails_1.DriverLastLocationDetails
        ],
        exports: [driver_entity_1.DriversEntity, truck_entity_1.TrucksEntity, shop_entity_1.ShopsEntity, location_service_1.LocationService]
    })
], TrucksModule);
exports.TrucksModule = TrucksModule;
//# sourceMappingURL=trucks.module.js.map