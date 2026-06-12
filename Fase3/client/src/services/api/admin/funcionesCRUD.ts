import axios from 'axios'

const API_BASE =
  import.meta.env.VITE_API_URL ??
  'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE,
})

/* ───────────────────────────────────────────── */
/* TYPES */
/* ───────────────────────────────────────────── */

export interface PeliculaOption {
  id: string
  titulo: string
  tipo: string
  duracionMin: number
  activa: boolean
}

export interface SalaOption {
  id: string
  nombre: string
  tipoSala: string
  capacidad: number

  cine: {
    id: string
    nombre: string
  }
}

export interface Funcion {
  id: string
  fechaHora: string
  precioBase: number
  activa: boolean

  pelicula?: {
    id: string
    titulo: string
    tipo?: string
  }

  sala?: {
    id: string
    nombre: string
    tipoSala?: string
  }

  cine?: {
    id: string
    nombre: string
  }
}

export interface FuncionPayload {
  peliculaId: string
  salaId: string
  fechaHora: string
  tipo: string
  activa: boolean
}

/* ───────────────────────────────────────────── */
/* CATALOGOS */
/* ───────────────────────────────────────────── */

export async function getPeliculasList(): Promise<PeliculaOption[]> {
  const { data } = await api.get(
    '/api/admin/funciones/peliculas/list',
  )

  return data
}

export async function getSalasList(): Promise<SalaOption[]> {
  const { data } = await api.get(
    '/api/admin/funciones/salas/list',
  )

  return data
}

/* ───────────────────────────────────────────── */
/* CRUD */
/* ───────────────────────────────────────────── */

export async function getFunciones(): Promise<Funcion[]> {
  const { data } = await api.get(
    '/api/admin/funciones',
  )

  return data.map((f: any) => ({
    ...f,
    precioBase: Number(f.precioBase),
  }))
}

export async function getFuncion(
  id: string,
): Promise<Funcion> {
  const { data } = await api.get(
    `/api/admin/funciones/${id}`,
  )

  return {
    ...data,
    precioBase: Number(data.precioBase),
  }
}

export async function createFuncion(
  payload: FuncionPayload,
) {
  const { data } = await api.post(
    '/api/admin/funciones',
    payload,
  )

  return data
}

export async function updateFuncion(
  id: string,
  payload: FuncionPayload,
) {
  const { data } = await api.put(
    `/api/admin/funciones/${id}`,
    payload,
  )

  return data
}

export async function deleteFuncion(
  id: string,
) {
  const { data } = await api.delete(
    `/api/admin/funciones/${id}`,
  )

  return data
}

/* ───────────────────────────────────────────── */
/* FILTROS */
/* ───────────────────────────────────────────── */

export async function getFuncionesByMovie(
  peliculaId: string,
) {
  const { data } = await api.get(
    `/api/admin/funciones/pelicula/${peliculaId}`,
  )

  return data
}

export async function getFuncionesBySala(
  salaId: string,
) {
  const { data } = await api.get(
    `/api/admin/funciones/sala/${salaId}`,
  )

  return data
}

export async function getFuncionesByFecha(
  fecha: string,
) {
  const { data } = await api.get(
    `/api/admin/funciones/fecha/${fecha}`,
  )

  return data
}