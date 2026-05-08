import { AppModule } from './app.module';
import { AppService } from './app-service';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appService = app.select(AppModule).get(AppService);
  await appService.init();
  await app.listen(3000);
}

bootstrap();