export interface FunctionRecord {
  id: string;
  peliculaId: string;
  salaId: string;
  cinemaId: string;
  cityId: string;
  fechaHora: Date;
  precioBase: number;
  tipoSala: string;
  activa: boolean;
}

export interface PublicFunction {
  id: string;
  movieId: string;
  roomId: string;
  cinemaId: string;
  cityId: string;
  startTime: string;
  projectionType: string;
  price: number;
}

export interface FunctionFilters {
  movieId?: string;
  cityId?: string;
}
