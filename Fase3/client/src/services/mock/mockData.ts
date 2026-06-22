import type { City, Cinema, Movie,  Seat, User } from '@/types'

// ─── Usuarios de prueba ───────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ana García', email: 'ana@email.com', role: 'USER' },
  { id: 'u2', name: 'Carlos Pérez', email: 'admin@cinemax.com', role: 'ADMIN' },
]

// ─── Ciudades ─────────────────────────────────────────────────────────────────
export const MOCK_CITIES: City[] = [
  { id: 'city1', name: 'Ciudad de Guatemala' },
  { id: 'city2', name: 'Quetzaltenango' },
  { id: 'city3', name: 'Antigua Guatemala' },
]

// ─── Cines ────────────────────────────────────────────────────────────────────
export const MOCK_CINEMAS: Cinema[] = [
  { id: 'cin1', name: 'CineMax Pradera', address: 'Zona 10, Ciudad de Guatemala', cityId: 'city1' },
  { id: 'cin2', name: 'CineMax Oakland', address: 'Oakland Mall, Zona 10', cityId: 'city1' },
  { id: 'cin3', name: 'CineMax Xela', address: 'Centro Comercial, Xela', cityId: 'city2' },
  { id: 'cin4', name: 'CineMax Antigua', address: '5a Av. Norte, Antigua', cityId: 'city3' },
]

// ─── Películas ────────────────────────────────────────────────────────────────
export const MOCK_MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Dune: Part Two',
    synopsis: 'Paul Atreides une fuerzas con Chani y los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
    posterUrl: 'https://placehold.co/300x450/1e293b/94a3b8?text=Dune+2',
    duration: 166,
    genre: ['Ciencia Ficción', 'Aventura'],
    rating: 'PG-13',
    category: 'ESTRENO',
    releaseDate: '2026-03-01',
  },
  {
    id: 'm2',
    title: 'The Dark Knight Returns',
    synopsis: 'Bruce Wayne regresa de su retiro para proteger Gotham de una amenaza sin precedentes.',
    posterUrl: 'https://placehold.co/300x450/0f172a/60a5fa?text=Batman',
    duration: 152,
    genre: ['Acción', 'Superhéroes'],
    rating: 'PG-13',
    category: 'PRE_VENTA',
    releaseDate: '2026-07-15',
  },
  {
    id: 'm3',
    title: 'Inception',
    synopsis: 'Un ladrón que roba secretos corporativos es dado la tarea de plantar una idea en la mente de alguien.',
    posterUrl: 'https://placehold.co/300x450/1c1917/a78bfa?text=Inception',
    duration: 148,
    genre: ['Ciencia Ficción', 'Thriller'],
    rating: 'PG-13',
    category: 'RE_ESTRENO',
    releaseDate: '2010-07-16',
  },
  {
    id: 'm4',
    title: 'Oppenheimer',
    synopsis: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
    posterUrl: 'https://placehold.co/300x450/431407/fb923c?text=Oppenheimer',
    duration: 180,
    genre: ['Drama', 'Historia'],
    rating: 'R',
    category: 'ESTRENO',
    releaseDate: '2026-05-20',
  },
  {
    id: 'm5',
    title: 'Avatar 3',
    synopsis: 'Jake Sully y Neytiri enfrentan una nueva amenaza que pone en riesgo el futuro de Pandora.',
    posterUrl: 'https://placehold.co/300x450/042f2e/34d399?text=Avatar+3',
    duration: 200,
    genre: ['Ciencia Ficción', 'Aventura'],
    rating: 'PG-13',
    category: 'PRE_VENTA',
    releaseDate: '2026-12-19',
  },
  {
    id: 'm6',
    title: 'The Matrix',
    synopsis: 'Un hacker descubre la naturaleza de la realidad y su papel en la guerra contra sus controladores.',
    posterUrl: 'https://placehold.co/300x450/14532d/4ade80?text=Matrix',
    duration: 136,
    genre: ['Ciencia Ficción', 'Acción'],
    rating: 'R',
    category: 'RE_ESTRENO',
    releaseDate: '1999-03-31',
  },
    {
    id: 'm7',
    title: 'The Matrix2',
    synopsis: 'Un hacker descubre la naturaleza de la realidad y su papel en la guerra contra sus controladores.',
    posterUrl: 'https://placehold.co/300x450/14532d/4ade80?text=Matrix',
    duration: 136,
    genre: ['Ciencia Ficción', 'Acción'],
    rating: 'R',
    category: 'RE_ESTRENO',
    releaseDate: '1999-03-31',
  },
]

// ─── Funciones ────────────────────────────────────────────────────────────────


// ─── Generador de asientos ────────────────────────────────────────────────────
// Genera una sala de 8 filas x 10 columnas con ~30% de asientos ocupados
export function generateMockSeats(showtimeId: string): Seat[] {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const columns = 10
  const seats: Seat[] = []

  const seed = showtimeId.charCodeAt(showtimeId.length - 1)
  const occupiedPositions = new Set<string>()

  for (let i = 0; i < 24; i++) {
    const row = rows[(seed * (i + 1) * 7) % rows.length]
    const col = ((seed * (i + 3) * 11) % columns) + 1
    occupiedPositions.add(`${row}${col}`)
  }

  rows.forEach((row) => {
    for (let col = 1; col <= columns; col++) {
      const label = `${row}${col}`
      seats.push({
        id: `${showtimeId}-${label}`,
        row,
        column: col,
        status: occupiedPositions.has(label) ? 'OCCUPIED' : 'AVAILABLE',
      })
    }
  })

  return seats
}