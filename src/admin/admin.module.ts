import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersEntity } from 'src/users/models/users.entity';
import { CategoriesEntity } from 'src/utils/models/categories.entity';
import { AdminController } from './controllers/admin.controller';
import { ConsolidationCenterEntity } from './models/consolidationCenters.entity';
import { AdminService } from './services/admin.service';
import { BaseLocationsEntity } from './models/baseLocations.entity';
import { PortalSettingsEntity } from './models/portalSettings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsolidationCenterEntity, CategoriesEntity, UsersEntity, BaseLocationsEntity, PortalSettingsEntity]),
    MulterModule.register({
      dest: './public',
    })
  ],
  controllers: [AdminController],
  providers: [AdminService, ConsolidationCenterEntity, CategoriesEntity, UsersEntity, BaseLocationsEntity, PortalSettingsEntity]
})
export class AdminModule {}
