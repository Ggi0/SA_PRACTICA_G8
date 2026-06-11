import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsUUID,
  IsString,
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
@IsString({ message: 'funcionId debe ser un string' })
funcionId: string

  @IsArray({ message: 'asientos debe ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debes enviar al menos un asiento' })
  @IsUUID('4', { each: true, message: 'Cada asiento debe ser un UUID válido' })
  asientos: string[];
}