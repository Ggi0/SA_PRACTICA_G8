import { IsOptional, IsUUID } from 'class-validator';

/**
 * DTO opcional para confirmar reserva.
 *
 * Se usa principalmente cuando la confirmación llega
 * con una referencia de pago.
 */
export class ConfirmarReservaDto {
  @IsOptional()
  @IsUUID('4', { message: 'referenciaPago debe ser un UUID válido' })
  referenciaPago?: string;
}