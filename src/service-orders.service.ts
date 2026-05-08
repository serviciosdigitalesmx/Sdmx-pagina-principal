import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceOrdersService {
  signedUpload(file: any) {
    console.log('Método signedUpload ejecutado');
    // Implementación del método signedUpload
    // Por ejemplo, podrías generar una firma para subir un archivo a un bucket de AWS S3
    return 'https://example.com/upload';
  }
}