"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const typeorm_1 = require("@nestjs/typeorm");
const users_entity_1 = require("../users/models/users.entity");
const categories_entity_1 = require("../utils/models/categories.entity");
const admin_controller_1 = require("./controllers/admin.controller");
const consolidationCenters_entity_1 = require("./models/consolidationCenters.entity");
const admin_service_1 = require("./services/admin.service");
const baseLocations_entity_1 = require("./models/baseLocations.entity");
const portalSettings_entity_1 = require("./models/portalSettings.entity");
let AdminModule = class AdminModule {
};
AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([consolidationCenters_entity_1.ConsolidationCenterEntity, categories_entity_1.CategoriesEntity, users_entity_1.UsersEntity, baseLocations_entity_1.BaseLocationsEntity, portalSettings_entity_1.PortalSettingsEntity]),
            platform_express_1.MulterModule.register({
                dest: './public',
            })
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService, consolidationCenters_entity_1.ConsolidationCenterEntity, categories_entity_1.CategoriesEntity, users_entity_1.UsersEntity, baseLocations_entity_1.BaseLocationsEntity, portalSettings_entity_1.PortalSettingsEntity]
    })
], AdminModule);
exports.AdminModule = AdminModule;
//# sourceMappingURL=admin.module.js.map