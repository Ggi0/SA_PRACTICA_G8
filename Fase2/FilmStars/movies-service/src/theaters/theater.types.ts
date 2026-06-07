export interface TheaterRecord {
  id: string;
  ciudadId: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  creado: Date;
  modificacion: Date;
}

export interface PublicTheater {
  id: string;
  name: string;
  address: string;
  cityId: string;
}
