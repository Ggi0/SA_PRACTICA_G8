// src/payments/services/payments.service.ts

import {
  Inject,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PagoRepository } from '../repositories/pago.repository';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { MensajeriaEntity } from '../../database/entities/mensajeria.entity';
import { PagoEntity } from '../../database/entities/pago.entity';
import { PAYMENT_GATEWAY } from '../interfaces/payment-gateway.interface';
import type { PaymentGatewayInterface } from '../interfaces/payment-gateway.interface';


import { DetallePagoRepository } from '../repositories/detalle-pago.repository';
import { BoletoRepository } from '../repositories/boleto.repository';



import { MESSAGE_PUBLISHER } from '../../messaging/publisher.interface';

import type {
  MessagePublisher,
} from '../../messaging/publisher.interface';

import { RABBITMQ_QUEUES } from '../../messaging/rabbitmq.constants';


@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly pagoRepository: PagoRepository,

private readonly detalleRepo: DetallePagoRepository,
  private readonly boletoRepo: BoletoRepository,


    @InjectRepository(MensajeriaEntity)
    private readonly mensajeriaRepo: Repository<MensajeriaEntity>,

    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: PaymentGatewayInterface,

    @Inject(MESSAGE_PUBLISHER)
    private readonly publisher: MessagePublisher,
  ) {}

  /**
   * Procesa un pago completo:
   * 1) crea pago pendiente
   * 2) llama al fake gateway
   * 3) actualiza estado
   * 4) guarda outbox
   * 5) publica resultado en payment_result_queue
   */
  async crearYProcesarPago(dto: CreatePaymentDto): Promise<PagoEntity> {
    const pago = await this.pagoRepository.createPago({
      reservaIdRef: dto.reservaId,
      usuarioIdRef: dto.usuarioId,
      monto: dto.monto.toFixed(2),
      moneda: dto.moneda ?? 'GTQ',
      metodoPago: dto.metodoPago,
      estado: PagoEstado.PENDIENTE,
    });

    try {
      const resultado = await this.paymentGateway.procesarPago({
        pagoId: pago.id,
        reservaId: dto.reservaId,
        usuarioId: dto.usuarioId,
        monto: dto.monto,
        moneda: dto.moneda ?? 'GTQ',
        metodoPago: dto.metodoPago,
      });

      await this.pagoRepository.updateResultado(pago.id, {
        estado: resultado.estado,
        proveedorRef: resultado.proveedorRef,
        procesadoEn: resultado.procesadoEn,
      });

      await this.guardarEventoOutbox({
        agregadoId: pago.id,
        tipoEvento: 'pago.procesado',
        payload: {
          pagoId: pago.id,
          reservaId: dto.reservaId,
          usuarioId: dto.usuarioId,
          estado: resultado.estado,
          monto: dto.monto,
          moneda: dto.moneda ?? 'GTQ',
          metodoPago: dto.metodoPago,
          proveedorRef: resultado.proveedorRef,
          procesadoEn: resultado.procesadoEn,
        },
      });

      if (resultado.estado === PagoEstado.APROBADO) {
  const pagoActual = await this.pagoRepository.findById(pago.id);

  if (!pagoActual) {
    throw new NotFoundException('Pago no encontrado tras aprobación');
  }

  // ✅ crear detalle
  await this.detalleRepo.crearDetallePago(
    pagoActual,
    dto.monto,
  );

  // ✅ crear boletos (por ahora 1)
  await this.boletoRepo.crearBoletos(
    pagoActual,
    dto.reservaId,
    1,
  );
}

      await this.publisher.publish(RABBITMQ_QUEUES.PAYMENT_RESULT, {
        reservaId: dto.reservaId,
        estado: resultado.estado,
        pagoId: pago.id,
      });

      const pagoActualizado = await this.pagoRepository.findById(pago.id);

      if (!pagoActualizado) {
        throw new NotFoundException(
          'Pago procesado pero no encontrado al recargar',
        );
      }

      return pagoActualizado;
    } catch (error) {
      this.logger.error('Error durante procesamiento del pago', error);

      await this.pagoRepository.updateResultado(pago.id, {
        estado: PagoEstado.FALLIDO,
        proveedorRef: null,
        procesadoEn: new Date(),
      });

      await this.guardarEventoOutbox({
        agregadoId: pago.id,
        tipoEvento: 'pago.fallido',
        payload: {
          pagoId: pago.id,
          reservaId: dto.reservaId,
          usuarioId: dto.usuarioId,
          estado: PagoEstado.FALLIDO,
          monto: dto.monto,
          moneda: dto.moneda ?? 'GTQ',
          metodoPago: dto.metodoPago,
          motivo: error instanceof Error ? error.message : 'Error desconocido',
          procesadoEn: new Date(),
        },
      });

      // También publicamos resultado fallido para que reservations-service actúe
      await this.publisher.publish(RABBITMQ_QUEUES.PAYMENT_RESULT, {
        reservaId: dto.reservaId,
        estado: PagoEstado.FALLIDO,
        pagoId: pago.id,
      });

      const pagoFallido = await this.pagoRepository.findById(pago.id);
      if (pagoFallido) {
        return pagoFallido;
      }

      throw new InternalServerErrorException(
        'No se pudo recuperar el pago fallido',
      );
    }
  }

  async getPagoById(id: string): Promise<PagoEntity> {
    const pago = await this.pagoRepository.findById(id);

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }

  /**
   * Este método lo usa RabbitMQ consumer.
   */
  async procesarPagoDesdeEvento(payload: {
    reservaId: string;
    usuarioId: string;
    monto: number;
    moneda?: string;
    metodoPago: string;
  }): Promise<PagoEntity> {
    return this.crearYProcesarPago({
      reservaId: payload.reservaId,
      usuarioId: payload.usuarioId,
      monto: payload.monto,
      moneda: payload.moneda ?? 'GTQ',
      metodoPago: payload.metodoPago,
    });
  }

  private async guardarEventoOutbox(params: {
    agregadoId: string;
    tipoEvento: string;
    payload: Record<string, unknown>;
  }): Promise<void> {
    const evento = this.mensajeriaRepo.create({
      servicioOrigen: 'payments-service',
      agregadoTipo: 'pago',
      agregadoId: params.agregadoId,
      tipoEvento: params.tipoEvento,
      payload: params.payload,
      estado: 'PENDIENTE',
    });

    await this.mensajeriaRepo.save(evento);
  }


  async obtenerBoletosUsuario(
  usuarioId: string,
  filtros: {
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    codigo?: string;
  },
) {
  return this.boletoRepo.buscarBoletosPorUsuario(
    usuarioId,
    filtros,
  );
}




async obtenerBoletosUsuarioPorCodigo(codigo: string) {
  const boleto = await this.boletoRepo.repo.findOne({
    where: { codigoBoleto: codigo },
    relations: {pago:true},
  });

  if (!boleto) {
    throw new NotFoundException('Boleto no encontrado');
  }

  return boleto;
}


  
}