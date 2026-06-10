import type { PaymentRequest, PaymentResult, Ticket } from '@/types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Procesar pago ────────────────────────────────────────────────────────────
// Simula el consumidor de RabbitMQ procesando la cola reserva.solicitada
export async function processPayment(payload: PaymentRequest): Promise<PaymentResult> {
  // Simula el tiempo de procesamiento asíncrono de la cola
  await delay(1500)

  // 10% de probabilidad de rechazo para simular casos reales
  const approved = Math.random() > 0.1

  return {
    transactionId: `TXN-${Date.now()}`,
    reservationId: payload.reservationId,
    status: approved ? 'APPROVED' : 'REJECTED',
    amount: 0,
    processedAt: new Date().toISOString(),
  }
}

// ─── Obtener boleto ───────────────────────────────────────────────────────────
// En el sistema real, el servicio de reservas emite el boleto
// después de consumir el evento pago.confirmado de RabbitMQ
export async function getTicket(reservationId: string): Promise<Ticket> {
  await delay(400)

  return {
    id: `TKT-${Date.now()}`,
    reservationId,
    movieTitle: 'Dune: Part Two',
    cinemaName: 'CineMax Pradera',
    roomName: 'Sala IMAX 1',
    showtime: 'Domingo 8 Jun, 2:00 PM',
    seats: ['D5', 'D6'],
    totalAmount: 170,
  }
}