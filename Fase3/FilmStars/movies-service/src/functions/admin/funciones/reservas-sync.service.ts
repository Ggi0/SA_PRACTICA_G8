import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ReservasSyncService {
  constructor(private readonly httpService: HttpService) {}

  async inicializarAsientosFuncion(payload: {
    funcionId: string;
    asientos: {
      asientoId: string;
      codigo: string;
      fila: string;
      numero: number;
    }[];
  }) {
    const baseUrl =
      process.env.RESERVATIONS_SERVICE_URL || 'http://reservations-service:3003';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${baseUrl}/reservas/internal/funciones/asientos`,
          payload,
          {
            timeout: 5000,
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      const remoteMessage =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo inicializar los asientos en reservations-service';

      throw new InternalServerErrorException(
        `Error al sincronizar función con reservations-service: ${remoteMessage}`,
      );
    }
  }
}