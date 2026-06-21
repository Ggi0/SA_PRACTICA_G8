// ─── Usuarios ────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

// ─── Películas ───────────────────────────────────────────────────────────────

export type MovieCategory = 'ESTRENO' | 'PRE_VENTA' | 'RE_ESTRENO'
export type ProjectionType = 'STANDARD' | '3D' | 'IMAX' | '4DX'

export interface Movie {
  id: string
  title: string
  synopsis: string
  posterUrl: string
  duration: number
  genre: string[]
  rating: string
  category: MovieCategory
  releaseDate: string
}

export interface City {
  id: string
  name: string
}

export interface Cinema {
  id: string
  name: string
  address: string
  cityId: string
}

export interface Showtime {
  id: string
  movieId: string
  roomId: string
  cinemaId: string
  cityId: string
  startTime: string
  projectionType: ProjectionType
  price: number
  roomName: string
  cinemaName: string
}

// ─── Asientos ────────────────────────────────────────────────────────────────

export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'SELECTED' | 'BLOCKED_TEMP'

export interface Seat {
  id: string
  row: string
  column: number
  status: SeatStatus
}

export interface Reservation {
  id: string
  userId: string
  showtimeId: string
  seatIds: string[]
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  totalAmount: number
  createdAt: string
}

// ─── Pagos ───────────────────────────────────────────────────────────────────

export interface PaymentRequest {
  reservationId: string
  cardNumber: string
  cardHolder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

export interface PaymentResult {
  transactionId: string
  reservationId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  amount: number
  processedAt: string
}

// ─── Boleto ──────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string
  reservationId: string
  movieTitle: string
  cinemaName: string
  roomName: string
  showtime: string
  seats: string[]
  totalAmount: number
}