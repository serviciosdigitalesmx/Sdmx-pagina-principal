import { Injectable } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';

@Injectable()
export class AppService {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  async metodo() {
    const signedUrl = await this.serviceOrdersService.signedUpload({});
    console.log(signedUrl);
  }

  async init() {
    await this.metodo();
  }
}