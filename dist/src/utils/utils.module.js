"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UtilsModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const tourRoute_entity_1 = require("../tours/models/tourRoute.entity");
const cusomerCompanyDetails_1 = require("../trucks/models/cusomerCompanyDetails");
const driver_entity_1 = require("../trucks/models/driver.entity");
const driverSessions_entity_1 = require("../trucks/models/driverSessions.entity");
const users_entity_1 = require("../users/models/users.entity");
const utils_controller_1 = require("./controllers/utils.controller");
const categories_entity_1 = require("./models/categories.entity");
const utils_service_1 = require("./services/utils.service");
const baseLocations_entity_1 = require("../admin/models/baseLocations.entity");
const driverSessionDistance_entity_1 = require("../trucks/models/driverSessionDistance.entity");
let UtilsModule = class UtilsModule {
};
UtilsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            typeorm_1.TypeOrmModule.forFeature([users_entity_1.UsersEntity, categories_entity_1.CategoriesEntity, driver_entity_1.DriversEntity, tourRoute_entity_1.TourRouteEntity, driverSessions_entity_1.DriverSessionsEntity, cusomerCompanyDetails_1.CustomerCompanyEntity, baseLocations_entity_1.BaseLocationsEntity, driverSessionDistance_entity_1.DriverSessionDistanceEntity])
        ],
        controllers: [utils_controller_1.UtilsController],
        providers: [utils_service_1.UtilsService, config_1.ConfigService, users_entity_1.UsersEntity, categories_entity_1.CategoriesEntity, driver_entity_1.DriversEntity, tourRoute_entity_1.TourRouteEntity, driverSessions_entity_1.DriverSessionsEntity, cusomerCompanyDetails_1.CustomerCompanyEntity],
        exports: [utils_service_1.UtilsService]
    })
], UtilsModule);
exports.UtilsModule = UtilsModule;
//# sourceMappingURL=utils.module.js.map