import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PagosAdmRepository } from './pagosAdm.repository';

@Injectable()
export class PagosAdmService {
  constructor(
    private readonly repo: PagosAdmRepository,
  ) {}

  /**
   *  ESCANEAR QR (flujo ideal)
   */
  async escanearBoleto(codigo: string) {
    const boleto = await this.repo.buscarPorCodigo(codigo);

    if (!boleto) {
      throw new NotFoundException('Boleto no existe');
    }

    if (boleto.estado === 'USADO') {
      throw new BadRequestException(
        'El boleto ya fue utilizado',
      );
    }

    if (boleto.estado === 'ANULADO') {
      throw new BadRequestException(
        'El boleto está anulado',
      );
    }

    // MARCAR COMO USADO
    boleto.estado = 'USADO';
    await this.repo.guardar(boleto);

    //  EVENTO A RESERVAS (IMPORTANTE)
    /*
    await this.publisher.publish('boleto_usado_queue', {
      reservaId: boleto.reservaIdRef,
      reservaAsientoId: boleto.reservaAsientoIdRef,
    });
    */

    return {
      mensaje: ' Acceso permitido',
      estado: boleto.estado,
      boletoId: boleto.id,
    };
  }

  /**
   *  BÚSQUEDA MANUAL (contingencia)
   */
  async buscarBoleto(codigo: string) {
    const boleto = await this.repo.buscarPorCodigo(codigo);

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    return boleto;
  }

  /**
   *  FORZAR VALIDACIÓN (ADMIN)
   */
  async forzarUso(boletoId: string) {
    const boleto = await this.repo.buscarPorId(boletoId);

    if (!boleto) {
      throw new NotFoundException('Boleto no encontrado');
    }

    boleto.estado = 'USADO';
    await this.repo.guardar(boleto);

    //  EVENTO FUTURO
    /*
    await this.publisher.publish('boleto_usado_queue', {
      reservaId: boleto.reservaIdRef,
      reservaAsientoId: boleto.reservaAsientoIdRef,
    });
    */

    return {
      mensaje: '✅ Validación forzada',
    };
  }

  /**
   *  LISTADO ADMIN
   */
  async listar(filtros: any) {
    return this.repo.buscarConFiltros(filtros);
  }
}