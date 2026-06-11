import { BadRequestException } from '@nestjs/common';

/**
 * Se lanza cuando una operación no cumple reglas del negocio.
 */
export class ReservaInvalidaException extends BadRequestException {
  constructor(message = 'La operación sobre la reserva no es válida') {
    super(message);
  }
}