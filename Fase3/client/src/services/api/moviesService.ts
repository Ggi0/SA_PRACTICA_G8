import axios from 'axios'
import type { City, Cinema, Movie, MovieCategory, Showtime } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const api = axios.create({ baseURL: API_BASE })

// ─── Tipos de paginación ──────────────────────────────────────────────────────

export interface PaginatedMovies {
  data: Movie[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MovieFilters {
  page?: number
  limit?: number
  category?: MovieCategory
  cityId?: string
}

// ─── Mapeo de categorías backend → frontend ───────────────────────────────────
function mapCategory(backendCategory: string): MovieCategory {
  const map: Record<string, MovieCategory> = {
    ESTRENO: 'ESTRENO',
    PRE_VENTA: 'PRE_VENTA',
    PREVENTA: 'PRE_VENTA',
    RE_ESTRENO: 'RE_ESTRENO',
    REESTRENO: 'RE_ESTRENO',
  }
  return map[backendCategory] ?? 'ESTRENO'
}

// Tipo de respuesta cruda del backend para películas
type RawMovie = {
  id: string
  title: string
  synopsis: string
  posterUrl: string
  duration: number
  genre: string[]
  rating: string
  category: string
  releaseDate: string
}

function mapMovie(m: RawMovie): Movie {
  return {
    id: m.id,
    title: m.title,
    synopsis: m.synopsis,
    posterUrl: m.posterUrl,
    duration: m.duration,
    genre: m.genre,
    rating: m.rating,
    category: mapCategory(m.category),
    releaseDate: m.releaseDate,
  }
}

// ─── Ciudades ─────────────────────────────────────────────────────────────────
export async function getCities(): Promise<City[]> {
  const { data } = await api.get<{ id: string; name: string }[]>('/api/movies/cities')
  return data.map((c) => ({ id: c.id, name: c.name }))
}

// ─── Cines por ciudad ─────────────────────────────────────────────────────────
export async function getCinemasByCity(cityId: string): Promise<Cinema[]> {
  const { data } = await api.get<{ id: string; name: string; address: string; cityId: string }[]>(
    `/api/movies/cities/${cityId}/theaters`,
  )
  return data.map((c) => ({ id: c.id, name: c.name, address: c.address, cityId: c.cityId }))
}

// ─── Películas con paginación del lado del servidor ───────────────────────────
// Endpoint esperado: GET /api/movies?page=1&limit=10&category=ESTRENO
// El backend debe responder: { data: Movie[], total: number, page: number, limit: number, totalPages: number }
export async function getMoviesPaginated(filters: MovieFilters): Promise<PaginatedMovies> {
  const { page = 1, limit = 10, category, cityId } = filters

  const params: Record<string, string | number> = { page, limit }
  if (category) params.category = category
  if (cityId) params.cityId = cityId

  const { data } = await api.get<{
    data: RawMovie[]
    total: number
    page: number
    limit: number
    totalPages: number
  }>('/api/movies/pages', { params })

  return {
    data: data.data.map(mapMovie),
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
  }
}

// ─── Películas sin paginación (compatibilidad con ShowtimeSelector) ───────────
export async function getMovies(category?: MovieCategory): Promise<Movie[]> {
  const params = category ? { category } : {}
  const { data } = await api.get<RawMovie[]>('/api/movies/all', { params })
  return data.map(mapMovie)
}

// ─── Película por ID ──────────────────────────────────────────────────────────
export async function getMovieById(id: string): Promise<Movie | undefined> {
  try {
    const { data } = await api.get<RawMovie>(`/api/movies/${id}`)
    return mapMovie(data)
  } catch {
    return undefined
  }
}

// ─── Funciones por película y ciudad ─────────────────────────────────────────
export async function getShowtimes(movieId: string, cityId?: string): Promise<Showtime[]> {
  const params = cityId ? { cityId } : {}
  const { data } = await api.get<{
    id: string
    movieId: string
    roomId: string
    cinemaId: string
    cityId: string
    startTime: string
    projectionType: string
    price: number
  }[]>(`/api/movies/${movieId}/functions`, { params })

  return data.map((f) => ({
    id: f.id,
    movieId: f.movieId,
    roomId: f.roomId,
    cinemaId: f.cinemaId,
    cityId: f.cityId,
    startTime: f.startTime,
    projectionType: (f.projectionType as Showtime['projectionType']) ?? 'STANDARD',
    price: f.price,
  }))
}

// ─── Función por ID ───────────────────────────────────────────────────────────
export async function getShowtimeById(id: string): Promise<Showtime | undefined> {
  try {
    const { data } = await api.get<{
      id: string
      movieId: string
      roomId: string
      cinemaId: string
      cityId: string
      startTime: string
      projectionType: string
      price: number
    }>(`/api/movies/functions/${id}`)
    return {
      id: data.id,
      movieId: data.movieId,
      roomId: data.roomId,
      cinemaId: data.cinemaId,
      cityId: data.cityId,
      startTime: data.startTime,
      projectionType: (data.projectionType as Showtime['projectionType']) ?? 'STANDARD',
      price: data.price,
    }
  } catch {
    return undefined
  }
}