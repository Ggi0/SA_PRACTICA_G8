import type { Seat, Reservation } from '@/types'
import { generateMockSeats } from '@/services/mock/mockData'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Almacén en memoria para simular la base de datos durante la sesión
const mockReservations = new Map<string, Reservation>()
const tempBlockedSeats = new Set<string>()

// ─── Asientos por función ─────────────────────────────────────────────────────
export async function getSeatsByShowtime(showtimeId: string): Promise<Seat[]> {
  await delay(500)
  const seats = generateMockSeats(showtimeId)
  // Mezcla los asientos bloqueados temporalmente en esta sesión
  return seats.map((s) =>
    tempBlockedSeats.has(s.id) ? { ...s, status: 'BLOCKED_TEMP' as const } : s
  )
}

// ─── Bloqueo temporal de asientos ────────────────────────────────────────────
// En el backend real esto usa SELECT ... FOR UPDATE dentro de una transacción
export async function blockSeats(
  showtimeId: string,
  seatIds: string[],
  userId: string
): Promise<{ reservationId: string }> {
  await delay(400)

  // Simula condición de carrera: si algún asiento ya está bloqueado, lanza 409
  const conflict = seatIds.find((id) => tempBlockedSeats.has(id))
  if (conflict) {
    throw Object.assign(new Error('Asiento no disponible'), { status: 409 })
  }

  seatIds.forEach((id) => tempBlockedSeats.add(id))

  // Libera automáticamente después de 10 minutos (igual que el backend)
  setTimeout(() => {
    seatIds.forEach((id) => tempBlockedSeats.delete(id))
  }, 10 * 60 * 1000)

  const reservationId = `RES-${Date.now()}`

  mockReservations.set(reservationId, {
    id: reservationId,
    userId,
    showtimeId,
    seatIds,
    status: 'PENDING',
    totalAmount: 0,
    createdAt: new Date().toISOString(),
  })

  return { reservationId }
}

// ─── Confirmar reservación (simula publicación a RabbitMQ) ───────────────────
// El backend retorna 202 Accepted — el procesamiento es asíncrono
export async function confirmReservation(
  reservationId: string,
  totalAmount: number
): Promise<{ accepted: boolean; message: string }> {
  await delay(300)

  const reservation = mockReservations.get(reservationId)
  if (!reservation) throw new Error('Reservación no encontrada')

  mockReservations.set(reservationId, { ...reservation, totalAmount })

  return { accepted: true, message: 'Reservación enviada a cola de procesamiento' }
}