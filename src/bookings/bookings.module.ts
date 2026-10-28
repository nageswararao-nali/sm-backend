import { HttpModule } from '@nestjs/axios';
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AdminModule } from 'src/admin/admin.module';
import { ConsolidationCenterEntity } from 'src/admin/models/consolidationCenters.entity';
import { AdminService } from 'src/admin/services/admin.service';
import { TourAssignTruckDriversEntity } from 'src/tours/models/tourAssignTruckDrivers.entity';
import { TourBookingDetailsEntity } from 'src/tours/models/tourBookingDetails.entity';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { DeliveryProofEntity } from 'src/tours/models/deliveryProof.entity';
import { ToursEntity } from 'src/tours/models/tours.entity';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { TrucksEntity } from 'src/trucks/models/truck.entity';
import { CustomerAddressEntity } from 'src/users/models/customerAddress.entity';
import { NotificationsEntity } from 'src/users/models/notifications.entity';
import { UsersEntity } from 'src/users/models/users.entity';
import { UsersService } from 'src/users/services/users.service';
import { CategoriesEntity } from 'src/utils/models/categories.entity';
import { UtilsService } from 'src/utils/services/utils.service';
import { UtilsModule } from 'src/utils/utils.module';
import { BookingController } from './controllers/booking.controller';
import { BookingEntity } from './models/booking.entity';
import { BookingConsolidationCentersEntity } from './models/bookingConsolidationCenters.entity';
import { BookingStatusEntity } from './models/bookingStatus.entity';
import { TripEntity } from './models/trip.entity';
import { BookingService } from './services/booking.service';
import { ShopsEntity } from 'src/trucks/models/shop.entity';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { PortalSettingsEntity } from 'src/admin/models/portalSettings.entity';
import { InvoiceDetailsEntity } from './models/invoiceDetails';
import { InvoiceNumberEntity } from './models/invoiceNumber';
import { RateDetailsEntity } from 'src/trucks/models/gmRates';
import { DeletedBookingsEntity } from './models/deletedBookings.entity';
import { PendingBookingEntity } from './models/pendingBookings';
import { SpecialAddressEntity } from 'src/users/models/specialAddress.entity';
import { CustomerBookingLogsEntity } from './models/customerBookingLogs';
import { PaymentTransactionsEntity } from './models/paymentTransactions.entity';
import { PaymentTransactionErrorsEntity } from './models/paymentTransactionErrors.entity';
import { BookingTimeBackupEntity } from './models/bdookingTimeBackup';
import { LocationsEntity } from 'src/trucks/models/locations.entity';
import { DriverLastLocationDetails } from 'src/trucks/models/driverLastLocDetails';
import { ToursModule } from 'src/tours/tours.module';
import { TrucksModule } from 'src/trucks/trucks.module';
import { BookingDispatchEntity } from './models/bookingDispatch.entity';
import { BookingDispatchCandidateEntity } from './models/bookingDispatchCandidate.entity';
import { DispatchTimeoutProcessor } from './queues/dispatch-timeout.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([BookingEntity, BookingConsolidationCentersEntity, ConsolidationCenterEntity, 
      UsersEntity, TripEntity, BookingStatusEntity, CustomerAddressEntity, CategoriesEntity, DriversEntity, 
      TourRouteEntity,
      DriverSessionsEntity,
      NotificationsEntity,
      ToursEntity,
      TrucksEntity,
      TourBookingDetailsEntity,
      TourAssignTruckDriversEntity,
      CustomerCompanyEntity,
      ShopsEntity,
      DriverSessionDistanceEntity,
      BaseLocationsEntity,
      InvoiceDetailsEntity,
      InvoiceNumberEntity, RateDetailsEntity, DeletedBookingsEntity, PendingBookingEntity,
      SpecialAddressEntity, CustomerBookingLogsEntity, PaymentTransactionsEntity, PaymentTransactionErrorsEntity,
      BookingTimeBackupEntity,
      LocationsEntity,
      DriverLastLocationDetails,
      DeliveryProofEntity,
      PortalSettingsEntity,
      BookingDispatchEntity,
      BookingDispatchCandidateEntity

    ]),
    AdminModule,
    UtilsModule,
    HttpModule,
    forwardRef(() => ToursModule),
    TrucksModule,
    BullModule.registerQueue({ name: 'dispatch-timeout' })
  ],
  controllers: [BookingController],
  providers: [
    BookingService, BookingEntity, BookingConsolidationCentersEntity, AdminService,
    ConsolidationCenterEntity, UsersService, UsersEntity, TripEntity, BookingStatusEntity,
    UtilsService, ToursEntity, TrucksEntity, TourBookingDetailsEntity, TourAssignTruckDriversEntity,
    CustomerCompanyEntity, ShopsEntity, DriverSessionDistanceEntity, InvoiceDetailsEntity, InvoiceNumberEntity,
    RateDetailsEntity, DeletedBookingsEntity, PendingBookingEntity, SpecialAddressEntity, CustomerBookingLogsEntity, BookingTimeBackupEntity,
    BookingDispatchEntity, BookingDispatchCandidateEntity, DispatchTimeoutProcessor
  ],
  exports: [BookingEntity, BookingConsolidationCentersEntity, TripEntity, BookingService]
})
export class BookingsModule {}
