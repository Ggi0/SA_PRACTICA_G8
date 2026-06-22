import { IsOptional, IsString, IsDateString } from 'class-validator';

export class FilterBoletosDto {
  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  codigo?: string;
}