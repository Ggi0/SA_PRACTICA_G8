import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

/**
 * DTO para crear una reserva.
 *
 * Request esperado:
 * {
 *   "funcionId": "uuid",
 *   "asientos": ["uuid", "uuid"]
 * }
 */
export class CrearReservaDto {
  @IsNotEmpty()
  @IsUUID('4', { message: 'funcionId debe ser un UUID válido' })
  funcionId: string;

  @IsArray({ message: 'asientos debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debes enviar al menos un asiento' })
  @IsUUID('4', { each: true, message: 'Cada asiento debe ser un UUID válido' })
  asientos: string[];
}