/**
 * DTO simple para documentar la respuesta de una reserva creada.
 * No es obligatorio para que funcione, pero ayuda a mantener claridad.
 */
export class ReservaResponseDto {
  id: string;
  estado: string;
  precioTotal: number;
  expiraEn: Date;
  asientos: Array<{
    id?: string;
    codigo: string;
    fila?: string;
    numero?: number;
  }>;
}