import { IsBoolean } from 'class-validator';

export class UpdateStatusDto {
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo!: boolean;
}
