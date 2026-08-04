import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { UsersEntity } from 'src/users/models/users.entity';
import { UsersModule } from 'src/users/users.module';
import { UtilsController } from './controllers/utils.controller';
import { CategoriesEntity } from './models/categories.entity';
import { UtilsService } from './services/utils.service';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UsersEntity, CategoriesEntity, DriversEntity, TourRouteEntity, DriverSessionsEntity, CustomerCompanyEntity, BaseLocationsEntity, DriverSessionDistanceEntity])
  ],
  controllers: [UtilsController],
  providers: [UtilsService, ConfigService, UsersEntity, CategoriesEntity, DriversEntity, TourRouteEntity, DriverSessionsEntity, CustomerCompanyEntity],
  exports: [UtilsService]
})
export class UtilsModule {}
