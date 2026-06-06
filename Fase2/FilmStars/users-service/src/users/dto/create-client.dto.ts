import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClientDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsEmail({}, { message: 'El email debe ser valido' })
  email!: string;

  @IsNotEmpty({ message: 'La contrasena es requerida' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  password!: string;

  @IsOptional()
  @IsIn(['admin', 'customer'])
  rol?: 'admin' | 'customer';

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
