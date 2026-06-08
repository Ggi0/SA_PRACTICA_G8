import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * Relación entre reserva y asientos
 */
@Entity('reserva_asiento')
export class ReservaAsientoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reserva_id', type: 'uuid' })
  reservaId: string;

  @Column({ name: 'estado_asiento_funcion_id', type: 'uuid' })
  estadoAsientoFuncionId: string;

  @Column({
    name: 'precio_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  precioUnitario: number;

  @Column({ name: 'tipo_entrada', default: 'GENERAL' })
  tipoEntrada: string;
}