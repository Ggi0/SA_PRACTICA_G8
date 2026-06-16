export type MovieType = 'ESTRENO' | 'PREVENTA' | 'REESTRENO';

// Categorías expuestas al frontend (mapeadas desde el DB tipo)
export type MovieCategory = 'ESTRENO' | 'PRE_VENTA' | 'RE_ESTRENO';

export interface MovieRecord {
  id: string;
  titulo: string;
  sinopsis: string | null;
  duracionMin: number;
  clasificacion: string | null;
  posterUrl: string | null;
  fechaEstreno: string | null;
  tipo: MovieType;
  activa: boolean;
  creado: Date;
  modificacion: Date;
  generos: string[];
}

export interface PublicMovie {
  id: string;
  title: string;
  synopsis: string;
  posterUrl: string;
  duration: number;
  genre: string[];
  rating: string;
  category: MovieCategory;
  releaseDate: string;
}

export interface MovieFilters {
  category?: MovieCategory;
}





/**
 * filtros del endpoint paginado
 */
export interface MoviePageFilters {
  category?: MovieCategory;
  cityId?: string;
  page: number;
  limit: number;
}

/**
 * resultado crudo del repositorio para paginación
 */
export interface MoviePageQueryResult {
  items: MovieRecord[];
  totalItems: number;
  page: number;
  limit: number;
}

/**
 * respuesta pública del endpoint paginado
 */
export interface PaginatedMoviesResult {
  data: PublicMovie[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
