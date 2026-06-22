// src/payments/repositories/pago.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PagoEntity } from '../../database/entities/pago.entity';
import { PagoEstado } from '../../common/enums/pago-estado.enum';

@Injectable()
export class PagoRepository {
  constructor(
    @InjectRepository(PagoEntity)
    private readonly pagoRepo: Repository<PagoEntity>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Crear un pago
   */
  async createPago(data: Partial<PagoEntity>): Promise<PagoEntity> {
    const pago = this.pagoRepo.create(data);
    return this.pagoRepo.save(pago);
  }

  /**
   * Buscar pago por ID
   */
async findById(id: string): Promise<PagoEntity | null> {
  return this.pagoRepo.findOne({
    where: { id },
    relations: {
      detalles: true,
      boletos: true,
      reembolsos: true, // también puedes cargar reembolsos si lo necesitas
    },
  });
}


  /**
   * Actualiza el resultado final de un pago
   */
  async updateResultado(
    pagoId: string,
    data: {
      estado: PagoEstado;
      proveedorRef?: string | null;
      procesadoEn: Date;
    },
  ): Promise<void> {
    await this.pagoRepo.update(pagoId, {
      estado: data.estado,
      proveedorRef: data.proveedorRef ?? undefined,
      procesadoEn: data.procesadoEn,
    });
  }

  /**
   * Ejemplo de transacción útil para evolución futura.
   * Por ahora todavía no guardamos detalle/boleto aquí,
   * pero queda listo si lo necesitas.
   */
  async withTransaction<T>(
    operation: (dataSource: DataSource) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async () => {
      return operation(this.dataSource);
    });
  }
}
