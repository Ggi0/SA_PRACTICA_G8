import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import { PagosAdmRepository } from './pagosAdm.repository';

import { MESSAGE_PUBLISHER } from '../messaging/publisher.interface';
import type { MessagePublisher } from '../messaging/publisher.interface';
import { RABBITMQ_QUEUES } from '../messaging/rabbitmq.constants';

@Injectable()
export class PagosAdmService {
  constructor(
    private readonly repo: PagosAdmRepository,

    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,

  ) { }

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


  // ✅ 2. ENVIAR EVENTO A RESERVAS
  await this.publisher.publish(RABBITMQ_QUEUES.BOLETO_USADO, {
    evento: 'boleto.usado',

    // ✅ datos clave para reservas
    boletoId: boleto.id,
    codigo: boleto.codigoBoleto,

    reservaId: boleto.reservaIdRef,
    usuarioId: boleto.pago.usuarioIdRef,

    // ⚠️ FUTURO: cuando tengas esto
    // reservaAsientoId: boleto.reservaAsientoIdRef,
  });


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

  await this.publisher.publish(RABBITMQ_QUEUES.BOLETO_USADO, {
    evento: 'boleto.usado',
    boletoId: boleto.id,
    reservaId: boleto.reservaIdRef,
    usuarioId: boleto.pago.usuarioIdRef,
    reservaAsientoId: boleto.reservaAsientoIdRef,
  });

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