import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE,
})

export interface Genre {
  id: string
  nombre: string
}

export interface MovieListItem {
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

export interface MovieDetail {
  id: string
  titulo: string
  sinopsis: string
  duracion_min: number
  clasificacion?: string
  poster_url?: string
  fecha_estreno?: string
  tipo: string
  activa?: boolean

  generos: {
    id: string
    nombre: string
  }[]
}

export interface CreateMovieDto {
  titulo: string
  sinopsis: string
  duracion_min: number
  clasificacion: string
  poster_url: string
  fecha_estreno: string
  tipo: string
  activa: boolean
  generos: string[]
}


export interface BulkUploadFieldError {
  field: string
  message: string
}

export interface BulkUploadRowError {
  rowNumber: number
  raw: Record<string, string>
  errors: BulkUploadFieldError[]
}

export interface BulkUploadResponse {
  summary: {
    totalFilas: number
    procesadasCorrectamente: number
    rechazadas: number
  }
  message: string
  errors: BulkUploadRowError[]
}



// LISTAR GENEROS


export async function getGenres(): Promise<Genre[]> {
  const { data } = await api.get('/api/admin/movies/genres/list')
  return data
}


// LISTAR PELICULAS


export async function getMovies(): Promise<MovieListItem[]> {
  const { data } = await api.get('/api/movies')
  return data
}


// OBTENER PELICULA


export async function getMovie(id: string): Promise<MovieDetail> {
  const { data } = await api.get(`/api/admin/movies/${id}`)
  return data
}


// CREAR


export async function createMovie(payload: CreateMovieDto) {
  const { data } = await api.post('/api/admin/movies', payload)
  return data
}


// ACTUALIZAR


export async function updateMovie(
  id: string,
  payload: CreateMovieDto,
) {
  const { data } = await api.put(
    `/api/admin/movies/${id}`,
    payload,
  )

  return data
}


// ELIMINAR


export async function deleteMovie(id: string) {
  const { data } = await api.delete(
    `/api/admin/movies/${id}`,
  )

  return data
}



// CARGA MASIVA CSV
export async function uploadMoviesCsv(
  file: File,
): Promise<BulkUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post(
    '/api/admin/movies/bulk/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return data
}
