import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE,
})

export interface CinemaOption {
  id: string
  nombre: string
  direccion: string
  ciudad: {
    id: string
    nombre: string
  }
}

export interface Sala {
  id: string
  nombre: string
  capacidad: number
  tipoSala: string
  activa: boolean

  cine: {
    id: string
    nombre: string
  }
}

export interface SalaDetail {
  id: string
  nombre: string
  capacidad: number
  tipoSala: string
  activa: boolean

  cine: {
    id: string
    nombre: string
  }
}

export interface SalaPayload {
  cineId: string
  nombre: string
  capacidad: number
  tipoSala: string
  activa: boolean
}

// ───────────────────────────────
// LISTAR CINES
// ───────────────────────────────

export async function getCinesList(): Promise<CinemaOption[]> {

  const { data } = await api.get(
    '/api/admin/salas/cines/list',
  )

  return data.map((c: any) => ({
    id: c.id,
    nombre: c.nombre,
    direccion: c.direccion,

    ciudad: {
      id: c.ciudad_id,
      nombre: c.ciudad_nombre,
    },
  }))
}

// ───────────────────────────────
// LISTAR SALAS
// ───────────────────────────────

export async function getSalas(): Promise<Sala[]> {
  const { data } = await api.get('/api/admin/salas')

  return data.map((s: any) => ({
    id: s.id,
    nombre: s.nombre,
    capacidad: s.capacidad,
    tipoSala: s.tipo_sala,
    activa: s.activa,

    cine: {
      id: s.cine_id,
      nombre: s.cine_nombre,
    },
  }))
}

// ───────────────────────────────
// FILTRAR POR CINE
// ───────────────────────────────

export async function getSalasByCinema(
  cinemaId: string,
): Promise<Sala[]> {

  const { data } = await api.get(
    `/api/admin/salas/cine/${cinemaId}`,
  )

  return data.map((s: any) => ({
    id: s.id,
    nombre: s.nombre,
    capacidad: s.capacidad,

    tipoSala:
      s.tipo_sala,

    activa:
      s.activa,

    cine: {
      id: cinemaId,
      nombre: '',
    },
  }))
}

// ───────────────────────────────
// OBTENER UNA SALA
// ───────────────────────────────

export async function getSala(
  id: string,
): Promise<SalaDetail> {

  const { data } = await api.get(
    `/api/admin/salas/${id}`,
  )

  return {
    id: data.id,
    nombre: data.nombre,
    capacidad: data.capacidad,

    tipoSala:
      data.tipo_sala,

    activa:
      data.activa,

    cine: {
      id: data.cine_id,
      nombre:
        data.cine_nombre,
    },
  }
}

// ───────────────────────────────
// CREAR
// ───────────────────────────────

export async function createSala(
  payload: SalaPayload,
) {
  const { data } = await api.post(
    '/api/admin/salas',
    payload,
  )

  return data
}

// ───────────────────────────────
// ACTUALIZAR
// ───────────────────────────────

export async function updateSala(
  id: string,
  payload: SalaPayload,
) {
  const { data } = await api.put(
    `/api/admin/salas/${id}`,
    payload,
  )

  return data
}

// ───────────────────────────────
// ELIMINAR
// ───────────────────────────────

export async function deleteSala(
  id: string,
) {
  const { data } = await api.delete(
    `/api/admin/salas/${id}`,
  )

  return data
}