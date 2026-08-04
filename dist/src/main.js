"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.listen(process.env.ENV == 'test' ? process.env.TEST_PORT : process.env.PROD_PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map