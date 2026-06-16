import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { AsientoEstado } from '../../common/enums/asiento-estado.enum';

/**
 * Estado actual de un asiento en una función
 */
@Entity('estado_asiento_funcion')
export class EstadoAsientoFuncionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'funcion_id_ref', type: 'uuid' })
  funcionIdRef: string;

  @Column({ name: 'asiento_id_ref', type: 'uuid' })
  asientoIdRef: string;

  @Column({ name: 'codigo_asiento' })
  codigoAsiento: string;

  @Column()
  fila: string;

  @Column()
  numero: number;

  @Column({
    type: 'varchar',
    default: AsientoEstado.DISPONIBLE,
  })
  estado: AsientoEstado;

  @Column({ name: 'reserva_id', type: 'uuid', nullable: true })
  reservaId?: string | null;

  @Column({ name: 'bloqueado_hasta', type: 'timestamp', nullable: true })
  bloqueadoHasta?: Date | null;

  @Column({ name: 'modificacion', type: 'timestamp' })
  modificacion: Date;
}