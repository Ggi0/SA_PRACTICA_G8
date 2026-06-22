import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BoletoEntity } from '../database/entities/boleto.entity';

@Injectable()
export class PagosAdmRepository {
  constructor(
    @InjectRepository(BoletoEntity)
    private readonly repo: Repository<BoletoEntity>,
  ) {}

  /**
   * Buscar boleto por código (QR)
   */
    async buscarPorCodigo(codigo: string) {
        return this.repo.findOne({
            where: { codigoBoleto: codigo },

            relations: {
                pago: true, 
            },

        });
    }

  /**
   * Buscar boleto por ID
   */

async buscarPorId(id: string) {
  return this.repo.findOne({
    where: { id },
    relations: {
      pago: true, 
    },
  });
}


  /**
   * Guardar cambios de estado
   */
  async guardar(boleto: BoletoEntity) {
    return this.repo.save(boleto);
  }

  /**
   * Filtros avanzados ADMIN
   */
  async buscarConFiltros(filtros: any) {
    const query = this.repo
      .createQueryBuilder('boleto')
      .leftJoinAndSelect('boleto.pago', 'pago');

    if (filtros.estado) {
      query.andWhere('boleto.estado = :estado', {
        estado: filtros.estado,
      });
    }

    if (filtros.codigo) {
      query.andWhere('boleto.codigo_boleto = :codigo', {
        codigo: filtros.codigo,
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

    return query.getMany();
  }
}
