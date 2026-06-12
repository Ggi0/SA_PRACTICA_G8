import { create } from 'zustand'
import type { Movie, Showtime, Seat, Ticket } from '@/types'

// ─── Pasos del flujo de compra ────────────────────────────────────────────────
export type CheckoutStep = 'movie' | 'showtime' | 'seats' | 'payment' | 'confirmation'

interface CheckoutState {
  step: CheckoutStep
  selectedCity: string | null
  selectedMovie: Movie | null
  selectedShowtime: Showtime | null
  selectedSeats: Seat[]
  reservationId: string | null
  ticket: Ticket | null

  // Acciones
  setCity: (cityId: string) => void
  selectMovie: (movie: Movie) => void
  selectShowtime: (showtime: Showtime) => void
  toggleSeat: (seat: Seat) => void
  setReservationId: (id: string) => void
  setTicket: (ticket: Ticket) => void
  goToStep: (step: CheckoutStep) => void
  reset: () => void
}

const initialState = {
  step: 'movie' as CheckoutStep,
  selectedCity: null,
  selectedMovie: null,
  selectedShowtime: null,
  selectedSeats: [],
  reservationId: null,
  ticket: null,
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  ...initialState,

  setCity: (cityId) => set({ selectedCity: cityId }),

  selectMovie: (movie) =>
    set({ selectedMovie: movie, step: 'showtime', selectedShowtime: null, selectedSeats: [] }),

  selectShowtime: (showtime) =>
    set({ selectedShowtime: showtime, step: 'seats', selectedSeats: [] }),

  // Agrega el asiento si no está seleccionado, lo quita si ya lo está
  toggleSeat: (seat) =>
    set((state) => {
      if (seat.status === 'OCCUPIED' || seat.status === 'BLOCKED_TEMP') return state
      const alreadySelected = state.selectedSeats.some((s) => s.id === seat.id)
      return {
        selectedSeats: alreadySelected
          ? state.selectedSeats.filter((s) => s.id !== seat.id)
          : [...state.selectedSeats, seat],
      }
    }),

  setReservationId: (id) => set({ reservationId: id, step: 'payment' }),

  setTicket: (ticket) => set({ ticket, step: 'confirmation' }),

  goToStep: (step) => set({ step }),

  reset: () => set(initialState),
}))