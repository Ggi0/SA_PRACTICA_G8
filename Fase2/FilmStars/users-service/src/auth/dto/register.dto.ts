import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre!: string;

  @IsEmail({}, { message: 'El email debe ser valido' })
  email!: string;

  @IsNotEmpty({ message: 'La contrasena es requerida' })
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  password!: string;
}
