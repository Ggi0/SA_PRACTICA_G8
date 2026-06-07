import type { City, Cinema, Movie, MovieCategory, Showtime } from '@/types'
import { MOCK_CITIES, MOCK_CINEMAS, MOCK_MOVIES, MOCK_SHOWTIMES } from '@/services/mock/mockData'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Ciudades ─────────────────────────────────────────────────────────────────
export async function getCities(): Promise<City[]> {
  await delay(300)
  return MOCK_CITIES
}

// ─── Cines por ciudad ─────────────────────────────────────────────────────────
export async function getCinemasByCity(cityId: string): Promise<Cinema[]> {
  await delay(400)
  return MOCK_CINEMAS.filter((c) => c.cityId === cityId)
}

// ─── Películas (opcionalmente filtradas por categoría) ────────────────────────
export async function getMovies(category?: MovieCategory): Promise<Movie[]> {
  await delay(500)
  if (category) return MOCK_MOVIES.filter((m) => m.category === category)
  return MOCK_MOVIES
}

// ─── Película por ID ──────────────────────────────────────────────────────────
export async function getMovieById(id: string): Promise<Movie | undefined> {
  await delay(300)
  return MOCK_MOVIES.find((m) => m.id === id)
}

// ─── Funciones por película y ciudad ─────────────────────────────────────────
export async function getShowtimes(movieId: string, cityId?: string): Promise<Showtime[]> {
  await delay(400)
  return MOCK_SHOWTIMES.filter(
    (st) => st.movieId === movieId && (!cityId || st.cityId === cityId)
  )
}

// ─── Función por ID ───────────────────────────────────────────────────────────
export async function getShowtimeById(id: string): Promise<Showtime | undefined> {
  await delay(200)
  return MOCK_SHOWTIMES.find((st) => st.id === id)
}