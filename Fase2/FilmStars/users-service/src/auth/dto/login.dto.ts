import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser valido' })
  email!: string;

  @IsNotEmpty({ message: 'La contrasena es requerida' })
  password!: string;
}
