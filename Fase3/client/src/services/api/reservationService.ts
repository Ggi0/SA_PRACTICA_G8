import axios from 'axios'
import httpClient from './httpClient'
import type { Seat } from '@/types'

// =========================
// Tipos del backend real
// =========================

type ApiSeatState = 'DISPONIBLE' | 'BLOQUEADO' | 'OCUPADO'

interface ApiSeat {
  id: string
  codigo: string
  fila: string
  numero: number
  estado: ApiSeatState
}

interface ApiSeatsResponse {
  funcionId: string
  asientos: ApiSeat[]
}

interface ApiAvailabilityResponse {
  funcionId: string
  disponibles: number
  bloqueados: number
  ocupados: number
}

interface ApiCreateReservationResponse {
  id: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
  expiraEn: string
  asientos: Array<{
    id: string
    codigo: string
    fila: string
    numero: number
  }>
}

interface ApiReservationResponse {
  id: string
  usuarioIdRef: string
  funcionIdRef: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
  expiraEn: string
}

interface ApiMyReservationItem {
  id: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
}

interface ApiConfirmReservationResponse {
  estado: 'CONFIRMADA'
}

// =========================
// Tipos que usa el frontend
// =========================

export interface ReservationAvailability {
  funcionId: string
  disponibles: number
  bloqueados: number
  ocupados: number
}

export interface ReservationDetails {
  id: string
  usuarioIdRef?: string
  funcionIdRef?: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
  expiraEn?: string
}

export interface MyReservationItem {
  id: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
  fechaCreacion?: string
}

export interface CreateReservationResult {
  reservationId: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
  precioTotal: number
  expiraEn: string
  asientos: Seat[]
}

// =========================
// Helpers
// =========================

function mapSeatStatus(apiStatus: ApiSeatState): Seat['status'] {
  switch (apiStatus) {
    case 'DISPONIBLE':
      return 'AVAILABLE'
    case 'OCUPADO':
      return 'OCCUPIED'
    case 'BLOQUEADO':
      return 'BLOCKED_TEMP'
    default:
      return 'BLOCKED_TEMP'
  }
}

function mapApiSeatToFrontend(seat: ApiSeat): Seat {
  return {
    id: seat.id,
    row: seat.fila,
    column: seat.numero,
    status: mapSeatStatus(seat.estado),
  }
}

function mapReservedSeatToFrontend(
  seat: ApiCreateReservationResponse['asientos'][number]
): Seat {
  return {
    id: seat.id,
    row: seat.fila,
    column: seat.numero,
    status: 'SELECTED',
  }
}

function normalizeApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      error.message ||
      'Error desconocido'

    throw Object.assign(new Error(message), {
      status,
      data: error.response?.data,
    })
  }

  throw error
}

// =========================
// Endpoints reales
// =========================

// 1. Mapa de asientos
export async function getSeatsByShowtime(funcionId: string): Promise<Seat[]> {
  try {
    const { data } = await httpClient.get<ApiSeatsResponse>(
      `/reservas/funciones/${funcionId}/asientos`
    )

    return data.asientos.map(mapApiSeatToFrontend)
  } catch (error) {
    normalizeApiError(error)
  }
}

// 2. Resumen de disponibilidad
export async function getAvailabilityByShowtime(
  funcionId: string
): Promise<ReservationAvailability> {
  try {
    const { data } = await httpClient.get<ApiAvailabilityResponse>(
      `/reservas/funciones/${funcionId}/disponibilidad`
    )

    return data
  } catch (error) {
    normalizeApiError(error)
  }
}

// 3. Crear reserva
// Mantengo el nombre blockSeats para no romper demasiado tu código actual
export async function blockSeats(
  funcionId: string,
  seatIds: string[]
): Promise<CreateReservationResult> {
  try {
    const { data } = await httpClient.post<ApiCreateReservationResponse>(
      '/reservas',
      {
        funcionId,
        asientos: seatIds,
      }
    )

    return {
      reservationId: data.id,
      estado: data.estado,
      precioTotal: data.precioTotal,
      expiraEn: data.expiraEn,
      asientos: data.asientos.map(mapReservedSeatToFrontend),
    }
  } catch (error) {
    normalizeApiError(error)
  }
}

// Alias con nombre más correcto para el futuro
export const createReservation = blockSeats

// 4. Obtener reserva
export async function getReservation(id: string): Promise<ReservationDetails> {
  try {
    const { data } = await httpClient.get<ApiReservationResponse>(`/reservas/${id}`)

    return {
      id: data.id,
      usuarioIdRef: data.usuarioIdRef,
      funcionIdRef: data.funcionIdRef,
      estado: data.estado,
      precioTotal: data.precioTotal,
      expiraEn: data.expiraEn,
    }
  } catch (error) {
    normalizeApiError(error)
  }
}

// 5. Mis reservas
export async function getMyReservations(): Promise<MyReservationItem[]> {
  try {
    const { data } = await httpClient.get<ApiMyReservationItem[]>(
      '/reservas/mis-reservas'
    )

    return data
  } catch (error) {
    normalizeApiError(error)
  }
}

// 6. Cancelar reserva
export async function cancelReservation(id: string): Promise<{ message: string }> {
  try {
    const { data } = await httpClient.delete<{ message: string }>(`/reservas/${id}`)
    return data
  } catch (error) {
    normalizeApiError(error)
  }
}

// 7. Confirmar reserva
export async function confirmReservation(
  reservationId: string,
  referenciaPago?: string
): Promise<ApiConfirmReservationResponse> {
  try {
    const { data } = await httpClient.post<ApiConfirmReservationResponse>(
      `/reservas/${reservationId}/confirmar`,
      referenciaPago ? { referenciaPago } : {}
    )

    return data
  } catch (error) {
    normalizeApiError(error)
  }
}
