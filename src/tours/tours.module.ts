import { Module, forwardRef } from '@nestjs/common';
import { TourService } from './services/tour.service';
import { TourController } from './controllers/tour.controller';
import { ToursEntity } from './models/tours.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourBookingDetailsEntity } from './models/tourBookingDetails.entity';
import { BookingsModule } from 'src/bookings/bookings.module';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { BookingConsolidationCentersEntity } from 'src/bookings/models/bookingConsolidationCenters.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { UtilsService } from 'src/utils/services/utils.service';
import { HttpModule } from '@nestjs/axios';
import { UsersEntity } from 'src/users/models/users.entity';
import { CategoriesEntity } from 'src/utils/models/categories.entity';
import { TourAssignTruckDriversEntity } from './models/tourAssignTruckDrivers.entity';
import { TrucksModule } from 'src/trucks/trucks.module';
import { TrucksEntity } from 'src/trucks/models/truck.entity';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { ConfigService } from '@nestjs/config';
import { TourRouteEntity } from './models/tourRoute.entity';
import { TripEntity } from 'src/bookings/models/trip.entity';
import { DriverService } from 'src/trucks/services/driver.service';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { TruckService } from 'src/trucks/services/truck.service';
import { UsersService } from 'src/users/services/users.service';
import { LocationService } from 'src/trucks/services/location.service';
import { CustomerAddressEntity } from 'src/users/models/customerAddress.entity';
import { LocationsEntity } from 'src/trucks/models/locations.entity';
import { NotificationsEntity } from 'src/users/models/notifications.entity';
import { BookingStatusEntity } from 'src/bookings/models/bookingStatus.entity';
import { DriverTripFareDetailsEntity } from 'src/trucks/models/driverTripFareDetails';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { RateDetailsEntity } from 'src/trucks/models/gmRates';
import { BookingService } from 'src/bookings/services/booking.service';
import { GMTruckerRatesEntity } from 'src/trucks/models/gmTruckerRates';
import { GMTruckerPaymentsEntity } from 'src/trucks/models/gmTruckerPayments';
import { ShopsEntity } from 'src/trucks/models/shop.entity';
import { ShopService } from 'src/trucks/services/shop.service';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { AdminModule } from 'src/admin/admin.module';
import { AdminService } from 'src/admin/services/admin.service';
import { ConsolidationCenterEntity } from 'src/admin/models/consolidationCenters.entity';
import { GMDriverRatesEntity } from 'src/trucks/models/gmDriverRates';
import { DriverTransactionsEntity } from 'src/trucks/models/driverTransactions';
import { InvoiceDetailsEntity } from 'src/bookings/models/invoiceDetails';
import { InvoiceNumberEntity } from 'src/bookings/models/invoiceNumber';
import { DeletedBookingsEntity } from 'src/bookings/models/deletedBookings.entity';
import { VolumeRateDetailsEntity } from 'src/trucks/models/gmVolumeRates';
import { PendingBookingEntity } from 'src/bookings/models/pendingBookings';
import { SpecialAddressEntity } from 'src/users/models/specialAddress.entity';
import { CustomerBookingLogsEntity } from 'src/bookings/models/customerBookingLogs';
import { PaymentTransactionsEntity } from 'src/bookings/models/paymentTransactions.entity';
import { PaymentTransactionErrorsEntity } from 'src/bookings/models/paymentTransactionErrors.entity';
import { SeqTrackEntity } from './models/seqTrack';
import { BookingTimeBackupEntity } from 'src/bookings/models/bdookingTimeBackup';
import { UserLoginsEntity } from 'src/users/models/userLogin.entity';
import { DriverSessionSummaryEntity } from 'src/trucks/models/driverSessionSummary.entity';
import { CustomerAddressRatesEntity } from 'src/trucks/models/customerAddressRates.entity';
import { VehicleLiveDataEntity } from './models/vehicleLiveData.entity';
import { DriverLastLocationDetails } from 'src/trucks/models/driverLastLocDetails';
import { RedisModule } from 'src/common/redis/redis.module';
import { CallLogsEntity } from './models/callLogs.entity';
import { DeliveryProofEntity } from './models/deliveryProof.entity';
import { PortalSettingsEntity } from 'src/admin/models/portalSettings.entity';

@Module({
  imports: [
    forwardRef(() => BookingsModule),
    TypeOrmModule.forFeature([
      ToursEntity, TourBookingDetailsEntity, BookingEntity, BookingConsolidationCentersEntity, 
      UsersEntity, CategoriesEntity,
      TourAssignTruckDriversEntity,
      TrucksEntity,
      DriversEntity,
      TourRouteEntity,
      TripEntity,
      DriverSessionsEntity,
      CustomerAddressEntity,
      LocationsEntity,
      NotificationsEntity,
      BookingStatusEntity,
      DriverTripFareDetailsEntity,
      CustomerCompanyEntity,
      RateDetailsEntity,
      GMTruckerRatesEntity,
      GMTruckerPaymentsEntity,
      ShopsEntity,
      DriverSessionDistanceEntity,
      BaseLocationsEntity,
      ConsolidationCenterEntity,
      CategoriesEntity,
      GMDriverRatesEntity,
      DriverTransactionsEntity,
      InvoiceDetailsEntity,
      InvoiceNumberEntity,
      DeletedBookingsEntity,
      VolumeRateDetailsEntity,
      PendingBookingEntity,
      SpecialAddressEntity,
      CustomerBookingLogsEntity,
      PaymentTransactionsEntity,
      PaymentTransactionErrorsEntity,
      SeqTrackEntity,
      BookingTimeBackupEntity,
      UserLoginsEntity,
      DriverSessionSummaryEntity,
      CustomerAddressRatesEntity,
      VehicleLiveDataEntity,
      DriverLastLocationDetails,
      CallLogsEntity,
      DeliveryProofEntity,
      PortalSettingsEntity
    ]),
    UtilsModule,
    HttpModule,
    TrucksModule,
    AdminModule,
    RedisModule
  ],
  providers: [
    TourService, ToursEntity, TourBookingDetailsEntity, BookingEntity, 
    BookingConsolidationCentersEntity, 
    CategoriesEntity,
    TourAssignTruckDriversEntity,
    TrucksEntity,
    DriversEntity,
    TourRouteEntity,
    TripEntity,
    UtilsService,
    ConfigService,
    DriverService,
    TruckService,
    LocationService,
    UsersService,
    LocationService,
    CustomerAddressEntity,
    DriverTripFareDetailsEntity,
    CustomerCompanyEntity,
    RateDetailsEntity,
    BookingService,
    ShopService,
    ShopsEntity,
    DriverSessionDistanceEntity,
    BaseLocationsEntity,
    AdminService,
    ConsolidationCenterEntity,
    CategoriesEntity,
    InvoiceDetailsEntity,
    SpecialAddressEntity,
    SeqTrackEntity,
    VehicleLiveDataEntity
  ],
  controllers: [TourController],
  exports: [TourRouteEntity, ToursEntity, TourService]
})
export class ToursModule {}
