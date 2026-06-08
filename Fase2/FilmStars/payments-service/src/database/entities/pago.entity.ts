// src/database/entities/pago.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PagoEstado } from '../../common/enums/pago-estado.enum';
import { DetallePagoEntity } from './detalle-pago.entity';
import { BoletoEntity } from './boleto.entity';
import { ReembolsoEntity } from './reembolso.entity';

@Entity('pago')
export class PagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id_ref', type: 'uuid' })
  reservaIdRef: string;

  @Column({ name: 'usuario_id_ref', type: 'uuid' })
  usuarioIdRef: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: string;

  @Column({ type: 'varchar', default: 'GTQ' })
  moneda: string;

  @Column({
    type: 'enum',
    enum: PagoEstado,
    default: PagoEstado.PENDIENTE,
  })
  estado: PagoEstado;

  @Column({ name: 'metodo_pago', type: 'varchar' })
  metodoPago: string;

  @Column({ name: 'proveedor_ref', nullable: true })
  proveedorRef?: string;

  @Column({ name: 'procesado_en', nullable: true })
  procesadoEn?: Date;

  @CreateDateColumn({ name: 'creado' })
  creado: Date;

  @UpdateDateColumn({ name: 'modificacion' })
  modificacion: Date;

  @OneToMany(() => DetallePagoEntity, (d) => d.pago)
  detalles: DetallePagoEntity[];

  @OneToMany(() => BoletoEntity, (b) => b.pago)
  boletos: BoletoEntity[];

  @OneToMany(() => ReembolsoEntity, (r) => r.pago)
  reembolsos: ReembolsoEntity[];
}