import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DetallePagoEntity } from '../../database/entities/detalle-pago.entity';
import { PagoEntity } from '../../database/entities/pago.entity';

@Injectable()
export class DetallePagoRepository {
  constructor(
    @InjectRepository(DetallePagoEntity)
    private readonly repo: Repository<DetallePagoEntity>,
  ) {}

  async crearDetallePago(
    pago: PagoEntity,
    monto: number,
  ) {
    const detalle = this.repo.create({
      pago,
      tipo: 'COMPRA',
      descripcion: 'Compra de boletos',
      subtotal: monto.toFixed(2),
    });

    return this.repo.save(detalle);
  }
}