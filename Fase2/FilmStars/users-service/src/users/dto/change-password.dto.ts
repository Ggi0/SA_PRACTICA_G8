import { IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  currentPassword?: string;

  @IsNotEmpty({ message: 'La nueva contrasena es requerida' })
  @MinLength(8, { message: 'La nueva contrasena debe tener al menos 8 caracteres' })
  newPassword!: string;
}
