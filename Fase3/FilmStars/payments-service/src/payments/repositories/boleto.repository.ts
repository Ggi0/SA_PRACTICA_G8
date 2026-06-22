import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BoletoEntity } from '../../database/entities/boleto.entity';
import { PagoEntity } from '../../database/entities/pago.entity';

@Injectable()
export class BoletoRepository {
  constructor(
    @InjectRepository(BoletoEntity)
    public readonly repo: Repository<BoletoEntity>,
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



async buscarBoletosPorUsuario(
  usuarioId: string,
  filtros: {
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    codigo?: string;
  },
) {
  const query = this.repo
    .createQueryBuilder('boleto')
    .innerJoinAndSelect('boleto.pago', 'pago')
    .where('pago.usuario_id_ref = :usuarioId', { usuarioId });

  if (filtros.estado) {
    query.andWhere('boleto.estado = :estado', {
      estado: filtros.estado,
    });
  }

  if (filtros.fechaInicio) {
    query.andWhere('boleto.creado >= :fechaInicio', {
      fechaInicio: filtros.fechaInicio,
    });
  }

  if (filtros.fechaFin) {
    query.andWhere('boleto.creado <= :fechaFin', {
      fechaFin: filtros.fechaFin,
    });
  }

  if (filtros.codigo) {
    query.andWhere('boleto.codigo_boleto = :codigo', {
      codigo: filtros.codigo,
    });
  }

  return query.getMany();
}































}