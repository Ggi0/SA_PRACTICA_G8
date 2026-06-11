// src/database/entities/detalle-pago.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('detalle_pago')
export class DetallePagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo' })
  tipo: string;

  @Column({ name: 'descripcion', nullable: true })
  descripcion?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: string;

  @ManyToOne(() => PagoEntity, (pago) => pago.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}