import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersEntity } from './models/users.entity';
import { UtilsModule } from 'src/utils/utils.module';
import { CustomerAddressEntity } from './models/customerAddress.entity';
import { NotificationsEntity } from './models/notifications.entity';
import { SpecialAddressEntity } from './models/specialAddress.entity';
import { UserLoginsEntity } from './models/userLogin.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { DriverLastLocationDetails } from 'src/trucks/models/driverLastLocDetails';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('JWT_SECRET') ?? '',
          signOptions: {
            expiresIn: (config.get<string | number>('JWT_EXPIRES') ??
              '3d') as any,
          },
        };
      },
    }),
    ConfigModule,
    TypeOrmModule.forFeature([
      UsersEntity,
      CustomerAddressEntity,
      NotificationsEntity,
      SpecialAddressEntity,
      UserLoginsEntity,
      DriverLastLocationDetails,
    ]),
    UtilsModule,
  ],
  providers: [
    JwtStrategy,
    UsersService,
    UsersEntity,
    CustomerAddressEntity,
    NotificationsEntity,
    SpecialAddressEntity,
    UserLoginsEntity,
  ],
  controllers: [
    UsersController,
  ],
  exports: [JwtStrategy, PassportModule, UsersEntity, UserLoginsEntity],
})
export class UsersModule {}
