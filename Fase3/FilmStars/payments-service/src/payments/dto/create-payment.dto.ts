// src/payments/dto/create-payment.dto.ts

import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsUUID()
  reservaId: string;

  @IsUUID()
  usuarioId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  moneda?: string = 'GTQ';

  @IsString()
  @Length(2, 50)
  metodoPago: string;
}


