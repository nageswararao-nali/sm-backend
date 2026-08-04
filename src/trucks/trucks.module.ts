import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TruckController } from './controllers/truck.controller';
import { DriversEntity } from './models/driver.entity';
import { DriverSessionsEntity } from './models/driverSessions.entity';
import { TrucksEntity } from './models/truck.entity';
import { TruckService } from './services/truck.service';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { LocationsEntity } from './models/locations.entity';
import { DriverController } from './controllers/driver.controller';
import { DriverService } from './services/driver.service';
import { UsersEntity } from 'src/users/models/users.entity';
import { UsersModule } from 'src/users/users.module';
import { UsersService } from 'src/users/services/users.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { UtilsModule } from 'src/utils/utils.module';
import { CustomerAddressEntity } from 'src/users/models/customerAddress.entity';
import { HttpModule } from '@nestjs/axios';
import { CategoriesEntity } from 'src/utils/models/categories.entity';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { ToursEntity } from 'src/tours/models/tours.entity';
import { NotificationsEntity } from 'src/users/models/notifications.entity';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { TripEntity } from 'src/bookings/models/trip.entity';
import { BookingStatusEntity } from 'src/bookings/models/bookingStatus.entity';
import { ConfigService } from '@nestjs/config';
import { DriverTripFareDetailsEntity } from './models/driverTripFareDetails';
import { CustomerCompanyEntity } from './models/cusomerCompanyDetails';
import { RateDetailsEntity } from './models/gmRates';
import { GMTruckerPaymentsEntity } from './models/gmTruckerPayments';
import { GMTruckerRatesEntity } from './models/gmTruckerRates';
import { ShopsEntity } from './models/shop.entity';
import { ShopsController } from './controllers/shop.controller';
import { ShopService } from './services/shop.service';
import { DriverSessionDistanceEntity } from './models/driverSessionDistance.entity';
import { GMDriverRatesEntity } from './models/gmDriverRates';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { DriverTransactionsEntity } from './models/driverTransactions';
import { VolumeRateDetailsEntity } from './models/gmVolumeRates';
import { SpecialAddressEntity } from 'src/users/models/specialAddress.entity';
import { DataController } from './controllers/data.controller';
import { DataService } from './services/data.service';
import { UserLoginsEntity } from 'src/users/models/userLogin.entity';
import { DriverSessionSummaryEntity } from './models/driverSessionSummary.entity';
import { CustomerAddressRatesEntity } from './models/customerAddressRates.entity';
import { DriverLastLocationDetails } from './models/driverLastLocDetails';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DriversEntity, TrucksEntity, DriverSessionsEntity, LocationsEntity, 
      UsersEntity, CustomerAddressEntity, CategoriesEntity, TourRouteEntity, ToursEntity, NotificationsEntity, BookingEntity, TripEntity,
      BookingStatusEntity, DriverTripFareDetailsEntity, CustomerCompanyEntity, RateDetailsEntity, GMTruckerPaymentsEntity, GMTruckerRatesEntity,
      ShopsEntity, DriverSessionDistanceEntity, GMDriverRatesEntity, BaseLocationsEntity, DriverTransactionsEntity, VolumeRateDetailsEntity, 
      SpecialAddressEntity, UserLoginsEntity, DriverSessionSummaryEntity, CustomerAddressRatesEntity, DriverLastLocationDetails
    ]),
    UsersModule,
    UtilsModule,
    HttpModule
  ],
  controllers: [TruckController, LocationController, DriverController, ShopsController, DataController],
  providers: [
    TruckService, DriversEntity, TrucksEntity, DriverSessionsEntity, 
    LocationService, DriverService, UsersService, UsersEntity, UtilsService, ToursEntity, BookingEntity, TripEntity, DataService,
    BookingStatusEntity, ConfigService, DriverTripFareDetailsEntity, CustomerCompanyEntity, RateDetailsEntity, GMTruckerPaymentsEntity, GMTruckerRatesEntity,
    ShopsEntity, ShopService, DriverSessionDistanceEntity, GMDriverRatesEntity, DriverTransactionsEntity, VolumeRateDetailsEntity, SpecialAddressEntity,
    DriverSessionSummaryEntity, CustomerAddressRatesEntity, DriverLastLocationDetails
  ],
  exports: [DriversEntity, TrucksEntity, ShopsEntity, LocationService]
})
export class TrucksModule {}
