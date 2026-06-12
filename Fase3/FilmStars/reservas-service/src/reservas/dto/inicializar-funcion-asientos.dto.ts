import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AsientoInicialDto {
  @IsUUID()
  asientoId: string;

  @IsString()
  codigo: string;

  @IsString()
  fila: string;

  @IsInt()
  numero: number;
}

export class InicializarFuncionAsientosDto {
  @IsUUID()
  funcionId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AsientoInicialDto)
  asientos: AsientoInicialDto[];
}