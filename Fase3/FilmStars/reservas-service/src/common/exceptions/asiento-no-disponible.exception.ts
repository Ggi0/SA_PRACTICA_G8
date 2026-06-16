import { ConflictException } from '@nestjs/common';

/**
 * Se lanza cuando uno o más asientos ya no están disponibles.
 */
export class AsientoNoDisponibleException extends ConflictException {
  constructor(message = 'Uno o más asientos no están disponibles') {
    super(message);
  }
}