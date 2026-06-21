// src/services/api/admin/cinemasCRUD.ts

import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL ??
  ''

const api = axios.create({
  baseURL: API_BASE,
})

export interface City {
  id: string
  nombre: string
}

export interface Cinema {
  id: string
  ciudad_id: string
  ciudad_nombre: string
  nombre: string
  direccion: string
  activo: boolean
}

export interface CinemaDetail {
  id: string
  ciudad_id: string
  nombre: string
  direccion: string
  activo: boolean
}

export interface CinemaPayload {
  ciudad_id: string
  nombre: string
  direccion: string
  activo: boolean
}

// ─────────────────────────────────────────
// CIUDADES
// ─────────────────────────────────────────

export async function getCities(): Promise<
  City[]
> {
  const { data } = await api.get(
    '/api/admin/cinemas/cities/list',
  )

  return data
}

// ─────────────────────────────────────────
// CINES POR CIUDAD
// ─────────────────────────────────────────

export async function getCinemasByCity(
  cityId: string,
) {
  const { data } = await api.get(
    `/api/admin/cinemas/cities/${cityId}/cinemas`,
  )

  return data
}

// ─────────────────────────────────────────
// LISTAR TODOS
// ─────────────────────────────────────────

export async function getCinemas(): Promise<
  Cinema[]
> {
  const { data } = await api.get(
    '/api/admin/cinemas',
  )

  return data
}

// ─────────────────────────────────────────
// OBTENER UNO
// ─────────────────────────────────────────

export async function getCinema(
  id: string,
): Promise<CinemaDetail> {
  const { data } = await api.get(
    `/api/admin/cinemas/${id}`,
  )

  return data
}

// ─────────────────────────────────────────
// CREAR
// ─────────────────────────────────────────

export async function createCinema(
  payload: CinemaPayload,
) {
  const { data } = await api.post(
    '/api/admin/cinemas',
    payload,
  )

  return data
}

// ─────────────────────────────────────────
// ACTUALIZAR
// ─────────────────────────────────────────

export async function updateCinema(
  id: string,
  payload: CinemaPayload,
) {
  const { data } = await api.put(
    `/api/admin/cinemas/${id}`,
    payload,
  )

  return data
}

// ─────────────────────────────────────────
// ELIMINAR
// ─────────────────────────────────────────

export async function deleteCinema(
  id: string,
) {
  const { data } = await api.delete(
    `/api/admin/cinemas/${id}`,
  )

  return data
}
