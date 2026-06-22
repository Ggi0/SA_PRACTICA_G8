import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BoletoEntity } from '../../database/entities/boleto.entity';
import { PagoEntity } from '../../database/entities/pago.entity';

@Injectable()
export class BoletoRepository {
  constructor(
    @InjectRepository(BoletoEntity)
    private readonly repo: Repository<BoletoEntity>,
  ) {}

  async crearBoletos(
    pago: PagoEntity,
    reservaId: string,
    cantidad: number = 1,
  ) {
    const boletos: BoletoEntity[] = [];

    for (let i = 0; i < cantidad; i++) {
      const boleto = this.repo.create({
        pago,
        reservaIdRef: reservaId,

        // ✅ TEMP mientras integras con reservas
        reservaAsientoIdRef: null,

        codigoBoleto: `BOL-${Date.now()}-${i}`,
        codigoQr: `QR-${Date.now()}-${i}`,
        estado: 'EMITIDO',
      });

      boletos.push(boleto);
    }

    return this.repo.save(boletos);
  }
}