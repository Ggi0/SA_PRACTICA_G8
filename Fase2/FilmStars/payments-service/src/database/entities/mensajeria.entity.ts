// src/database/entities/mensajeria.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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
  payload: Record<string, any>;

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_procesado', nullable: true })
  fechaProcesado?: Date;
}