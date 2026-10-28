import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { UtilsModule } from './utils/utils.module';
import { ToursModule } from './tours/tours.module';
import { BookingsModule } from './bookings/bookings.module';
import { TrucksModule } from './trucks/trucks.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './common/redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    CacheModule.register({isGlobal: true}),
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.ENV == 'test' ? process.env.TEST_POSTGRES_HOST : process.env.POSTGRES_HOST,
      port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      synchronize: true
    }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT || 6379),
          username: process.env.REDIS_USERNAME || undefined,
          password: process.env.REDIS_PASSWORD,
          db: Number(process.env.REDIS_DB || 0),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    UsersModule,
    UtilsModule,
    ToursModule,
    BookingsModule,
    TrucksModule,
    AdminModule,
    RedisModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
