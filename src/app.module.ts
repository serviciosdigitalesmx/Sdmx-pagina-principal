import { Module } from '@nestjs/common';
import { AppService } from './app-service';
import { ServiceOrdersService } from './service-orders.service';

@Module({
  providers: [AppService, ServiceOrdersService],
})
export class AppModule {}