import { NotFoundException } from '@nestjs/common';

/**
 * Se lanza cuando la reserva solicitada no existe.
 */
export class ReservaNoEncontradaException extends NotFoundException {
  constructor(message = 'Reserva no encontrada') {
    super(message);
  }
}