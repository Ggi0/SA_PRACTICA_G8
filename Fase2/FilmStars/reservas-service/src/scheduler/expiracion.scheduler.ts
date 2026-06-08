import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ExpiracionService } from '../reservas/services/expiracion.service';

@Injectable()
export class ExpiracionScheduler {
  constructor(private readonly expiracionService: ExpiracionService) {}

  @Cron('*/30 * * * * *') // cada 30 segundos
  async handleExpire() {
    const result = await this.expiracionService.expirarReservasVencidas();

    if (result.procesadas > 0) {
      console.log(`Reservas expiradas: ${result.procesadas}`);
    }
  }
}