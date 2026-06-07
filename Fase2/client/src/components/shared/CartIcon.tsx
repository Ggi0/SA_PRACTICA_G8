import { create } from 'zustand'
import type { Movie, Showtime, Seat } from '@/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string              // reservationId del bloqueo temporal
  movie: Movie
  showtime: Showtime
  seats: Seat[]
  totalAmount: number
  blockedAt: Date         // momento en que se bloqueó — para el countdown
  expiresAt: Date         // blockedAt + 10 minutos
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id' | 'blockedAt' | 'expiresAt'> & { reservationId: string }) => void
  removeItem: (reservationId: string) => void
  clearCart: () => void
  totalAmount: () => number
  isExpired: (item: CartItem) => boolean
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: ({ reservationId, movie, showtime, seats, totalAmount }) => {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // +10 min

    const newItem: CartItem = {
      id: reservationId,
      movie,
      showtime,
      seats,
      totalAmount,
      blockedAt: now,
      expiresAt,
    }

    set((state) => ({ items: [...state.items, newItem] }))

    // Auto-elimina del carrito cuando expira el bloqueo
    setTimeout(() => {
      set((state) => ({
        items: state.items.filter((i) => i.id !== reservationId),
      }))
    }, 10 * 60 * 1000)
  },

  removeItem: (reservationId) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== reservationId),
    })),

  clearCart: () => set({ items: [] }),

  totalAmount: () =>
    get().items.reduce((sum, item) => sum + item.totalAmount, 0),

  isExpired: (item) => new Date() > item.expiresAt,
}))