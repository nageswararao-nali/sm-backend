import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  await app.listen(process.env.ENV == 'test' ? process.env.TEST_PORT : process.env.PROD_PORT);
}
bootstrap();
