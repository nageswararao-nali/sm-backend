"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./services/users.service");
const users_controller_1 = require("./controllers/users.controller");
const config_1 = require("@nestjs/config");
const config_2 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("./models/users.entity");
const utils_module_1 = require("../utils/utils.module");
const customerAddress_entity_1 = require("./models/customerAddress.entity");
const notifications_entity_1 = require("./models/notifications.entity");
const specialAddress_entity_1 = require("./models/specialAddress.entity");
const userLogin_entity_1 = require("./models/userLogin.entity");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const jwt_strategy_1 = require("./jwt.strategy");
const driverLastLocDetails_1 = require("../trucks/models/driverLastLocDetails");
let UsersModule = class UsersModule {
};
UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_2.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    var _a, _b;
                    return {
                        secret: (_a = config.get('JWT_SECRET')) !== null && _a !== void 0 ? _a : '',
                        signOptions: {
                            expiresIn: ((_b = config.get('JWT_EXPIRES')) !== null && _b !== void 0 ? _b : '3d'),
                        },
                    };
                },
            }),
            config_2.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                users_entity_1.UsersEntity,
                customerAddress_entity_1.CustomerAddressEntity,
                notifications_entity_1.NotificationsEntity,
                specialAddress_entity_1.SpecialAddressEntity,
                userLogin_entity_1.UserLoginsEntity,
                driverLastLocDetails_1.DriverLastLocationDetails,
            ]),
            utils_module_1.UtilsModule,
        ],
        providers: [
            jwt_strategy_1.JwtStrategy,
            users_service_1.UsersService,
            users_entity_1.UsersEntity,
            customerAddress_entity_1.CustomerAddressEntity,
            notifications_entity_1.NotificationsEntity,
            specialAddress_entity_1.SpecialAddressEntity,
            userLogin_entity_1.UserLoginsEntity,
        ],
        controllers: [
            users_controller_1.UsersController,
        ],
        exports: [jwt_strategy_1.JwtStrategy, passport_1.PassportModule, users_entity_1.UsersEntity, userLogin_entity_1.UserLoginsEntity],
    })
], UsersModule);
exports.UsersModule = UsersModule;
//# sourceMappingURL=users.module.js.map