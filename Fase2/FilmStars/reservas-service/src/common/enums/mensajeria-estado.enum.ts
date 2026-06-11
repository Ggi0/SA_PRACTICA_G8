// Representa estados del outbox (mensajeria)
export enum MensajeriaEstado {
  PENDIENTE = 'PENDIENTE',
  PUBLICADO = 'PUBLICADO',
  PROCESADO = 'PROCESADO',
  FALLIDO = 'FALLIDO',
}