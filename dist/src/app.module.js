"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const bullmq_1 = require("@nestjs/bullmq");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const utils_module_1 = require("./utils/utils.module");
const tours_module_1 = require("./tours/tours.module");
const bookings_module_1 = require("./bookings/bookings.module");
const trucks_module_1 = require("./trucks/trucks.module");
const admin_module_1 = require("./admin/admin.module");
const redis_module_1 = require("./common/redis/redis.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.register({ isGlobal: true }),
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                host: process.env.ENV == 'test' ? process.env.TEST_POSTGRES_HOST : process.env.POSTGRES_HOST,
                port: parseInt(process.env.POSTGRES_PORT),
                username: process.env.POSTGRES_USERNAME,
                password: process.env.POSTGRES_PASSWORD,
                database: process.env.POSTGRES_DATABASE,
                ssl: { rejectUnauthorized: false },
                autoLoadEntities: true,
                synchronize: true
            }),
            bullmq_1.BullModule.forRootAsync({
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
            users_module_1.UsersModule,
            utils_module_1.UtilsModule,
            tours_module_1.ToursModule,
            bookings_module_1.BookingsModule,
            trucks_module_1.TrucksModule,
            admin_module_1.AdminModule,
            redis_module_1.RedisModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map