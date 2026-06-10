import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { MensajeriaEstado } from '../../common/enums/mensajeria-estado.enum';

/**
 * Outbox pattern (mensajes para RabbitMQ)
 */
@Entity('mensajeria')
export class MensajeriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'servicio_origen' })
  servicioOrigen: string;

  @Column({ name: 'agregado_tipo' })
  agregadoTipo: string;

  @Column({ name: 'agregado_id', type: 'uuid' })
  agregadoId: string;

  @Column({ name: 'tipo_evento' })
  tipoEvento: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson: any;

  @Column({
    type: 'varchar',
    default: MensajeriaEstado.PENDIENTE,
  })
  estado: MensajeriaEstado;

  @Column({ name: 'fecha_creacion', type: 'timestamp' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_procesado', type: 'timestamp', nullable: true })
  fechaProcesado?: Date;
}