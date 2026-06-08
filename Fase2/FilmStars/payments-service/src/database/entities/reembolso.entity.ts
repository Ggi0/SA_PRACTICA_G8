// src/database/entities/reembolso.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('reembolso')
export class ReembolsoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: string;

  @Column()
  motivo: string;

  @Column({ type: 'varchar', length: 50, default: 'PENDIENTE' })
  estado: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn: Date;

  @Column({ name: 'procesado_en', type: 'timestamp', nullable: true })
  procesadoEn?: Date;

  @ManyToOne(() => PagoEntity, (pago) => pago.reembolsos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
