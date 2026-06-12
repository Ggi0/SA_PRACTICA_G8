import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser valido' })
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string | null;

  @IsOptional()
  @IsString()
  dpi?: string | null;

  @IsOptional()
  @IsString()
  fechaNacimiento?: string | null;

  @IsOptional()
  @IsString()
  direccion?: string | null;
}
