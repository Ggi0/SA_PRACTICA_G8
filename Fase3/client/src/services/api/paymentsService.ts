import axios from 'axios'
import httpClient from './httpClient'
import type { PaymentRequest, PaymentResult, Ticket } from '@/types'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Procesar pago (mock) ─────────────────────────────────────────────────────
// Simula el consumidor de RabbitMQ procesando la cola reserva.solicitada
export async function processPayment(payload: PaymentRequest): Promise<PaymentResult> {
  await delay(1500)

  const approved = Math.random() > 0.1

  return {
    transactionId: `TXN-${Date.now()}`,
    reservationId: payload.reservationId,
    status: approved ? 'APPROVED' : 'REJECTED',
    amount: 0,
    processedAt: new Date().toISOString(),
  }
}

// ─── Obtener boleto (mock) ────────────────────────────────────────────────────
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

// ─── Tipos del backend real ───────────────────────────────────────────────────

export interface Boleto {
  id: string
  codigo: string
  estado: 'EMITIDO' | 'USADO' | 'CANCELADO'
  reservaId: string
  creado: string
}

// ─── Mis boletos (endpoint real — Práctica 5) ─────────────────────────────────
// GET /api/payments/boletos/mis-boletos
// Devuelve los boletos emitidos para el usuario autenticado.
// La ConfirmationPage hace polling sobre este endpoint porque el boleto
// se crea de forma asíncrona después de que RabbitMQ procesa pago.confirmado.
export async function getMisBoletos(): Promise<Boleto[]> {
  try {
    const { data } = await httpClient.get<Boleto[]>('/payments/boletos/mis-boletos')
    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        (error.response?.data as { message?: string })?.message || error.message
      throw Object.assign(new Error(message), { status: error.response?.status })
    }
    throw error
  }
}