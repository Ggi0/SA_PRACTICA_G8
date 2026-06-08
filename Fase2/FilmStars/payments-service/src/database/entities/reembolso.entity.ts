// src/database/entities/reembolso.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
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

  @Column({ default: 'PENDIENTE' })
  estado: string;

  @Column({ name: 'creado_en' })
  creadoEn: Date;

  @Column({ name: 'procesado_en', nullable: true })
  procesadoEn?: Date;

  @ManyToOne(() => PagoEntity, (pago) => pago.reembolsos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
