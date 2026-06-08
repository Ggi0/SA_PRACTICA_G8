import { useQuery } from '@tanstack/react-query'
import {
  getCities,
  getCinemasByCity,
  getMovies,
  getMovieById,
  getShowtimes,
  getShowtimeById,
} from '@/services/api/moviesService'
import { getSeatsByShowtime } from '@/services/api/reservationService'
import type { MovieCategory } from '@/types'

// ─── Query keys centralizados ─────────────────────────────────────────────────
// Tenerlos aquí evita typos y facilita invalidar el caché desde cualquier lugar
export const queryKeys = {
  cities: ['cities'] as const,
  cinemas: (cityId: string) => ['cinemas', cityId] as const,
  movies: (category?: MovieCategory) => ['movies', category] as const,
  movie: (id: string) => ['movie', id] as const,
  showtimes: (movieId: string, cityId?: string) => ['showtimes', movieId, cityId] as const,
  showtime: (id: string) => ['showtime', id] as const,
  seats: (showtimeId: string) => ['seats', showtimeId] as const,
}

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: getCities,
    staleTime: 1000 * 60 * 60, // Las ciudades no cambian — caché de 1 hora
  })
}

export function useCinemas(cityId: string | null) {
  return useQuery({
    queryKey: queryKeys.cinemas(cityId ?? ''),
    queryFn: () => getCinemasByCity(cityId!),
    enabled: !!cityId, // No consulta hasta que haya ciudad seleccionada
    staleTime: 1000 * 60 * 30,
  })
}

export function useMovies(category?: MovieCategory) {
  return useQuery({
    queryKey: queryKeys.movies(category),
    queryFn: () => getMovies(category),
    staleTime: 1000 * 60 * 5,
  })
}

export function useMovie(movieId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.movie(movieId ?? ''),
    queryFn: () => getMovieById(movieId!),
    enabled: !!movieId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useShowtimes(movieId: string | undefined, cityId?: string | null) {
  return useQuery({
    queryKey: queryKeys.showtimes(movieId ?? '', cityId ?? undefined),
    queryFn: () => getShowtimes(movieId!, cityId ?? undefined),
    enabled: !!movieId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useShowtime(showtimeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.showtime(showtimeId ?? ''),
    queryFn: () => getShowtimeById(showtimeId!),
    enabled: !!showtimeId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useSeats(showtimeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.seats(showtimeId ?? ''),
    queryFn: () => getSeatsByShowtime(showtimeId!),
    enabled: !!showtimeId,
    refetchInterval: 15 * 1000, // Refresca cada 15 segundos para ver cambios en tiempo real
    staleTime: 0,
  })
}