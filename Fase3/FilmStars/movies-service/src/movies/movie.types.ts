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
