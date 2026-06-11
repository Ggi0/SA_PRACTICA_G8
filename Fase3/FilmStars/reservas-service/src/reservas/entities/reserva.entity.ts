import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReservaEstado } from '../../common/enums/reserva-estado.enum';

/**
 * Entity que representa la tabla "reserva"
 */
@Entity('reserva')
export class ReservaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id_ref', type: 'uuid' })
  usuarioIdRef: string;

  @Column({ name: 'funcion_id_ref', type: 'uuid' })
  funcionIdRef: string;

  @Column({
    type: 'varchar',
    default: ReservaEstado.PENDIENTE,
  })
  estado: ReservaEstado;

  @Column({
    name: 'precio_total',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  precioTotal: number;

  @Column({ name: 'referencia_pago_ref', type: 'uuid', nullable: true })
  referenciaPagoRef?: string;

  @Column({ name: 'expira_en', type: 'timestamp' })
  expiraEn: Date;

  @CreateDateColumn({ name: 'creado' })
  creado: Date;

  @UpdateDateColumn({ name: 'modificacion' })
  modificacion: Date;
}