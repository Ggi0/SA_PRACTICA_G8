// src/database/entities/boleto.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,   // 👈 agregado
} from 'typeorm';

import { PagoEntity } from './pago.entity';

@Entity('boleto')
export class BoletoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id_ref', type: 'uuid' })
  reservaIdRef: string;

  @Column({ name: 'reserva_asiento_id_ref', type: 'uuid' })
  reservaAsientoIdRef: string;

  @Column({ name: 'codigo_boleto' })
  codigoBoleto: string;

  @Column({ name: 'codigo_qr', nullable: true })
  codigoQr?: string;

  @Column({ type: 'varchar', length: 50, default: 'EMITIDO' })
  estado: string;

  @CreateDateColumn({ name: 'creado', type: 'timestamp' })
  creado: Date;

  @ManyToOne(() => PagoEntity, (pago) => pago.boletos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pago_id' })
  pago: PagoEntity;
}
