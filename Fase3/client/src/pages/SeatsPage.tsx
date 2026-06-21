import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react'
import { SeatMap } from '@/components/seats/SeatMap'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'
import { useShowtime, useMovie, useCinemas } from '@/hooks/useMovieData'
import { useCheckoutStore } from '@/context/checkoutStore'
import { useCartStore } from '@/context/cartStore'
import { useAuth } from '@/context/AuthContext'
import { blockSeats } from '@/services/api/reservationService'

const PROJECTION_LABELS: Record<string, string> = {
  STANDARD: 'Estándar',
  '3D': '3D',
  IMAX: 'IMAX',
  '4DX': '4DX',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export function SeatsPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: showtime } = useShowtime(showtimeId)
  const { selectedSeats } = useCheckoutStore()
  const { addItem } = useCartStore()
  const [isBlocking, setIsBlocking] = useState(false)

  const movieId = showtime?.movieId
  const { data: movie } = useMovie(movieId)

  // Resuelve el cine reutilizando la lista de cines de la ciudad
  const { data: cinemas } = useCinemas(showtime?.cityId ?? null)
  const cinema = cinemas?.find((c) => c.id === showtime?.cinemaId)

  // TODO: no existe un tipo Room ni endpoint para resolver roomId -> nombre.
  // Placeholder temporal hasta definir la fuente real.
  const cinemaName = showtime?.cinemaName
  const roomName = showtime?.roomName

  const totalAmount = selectedSeats.length * (showtime?.price ?? 0)

  const handleAddToCart = async () => {
    if (!showtimeId || !user || selectedSeats.length === 0 || !showtime || !movie || !cinema || !roomName) return

    setIsBlocking(true)
    try {
      const result = await blockSeats(
        showtimeId,
        selectedSeats.map((s) => s.id)
      )

      addItem({
        reservationId: result.reservationId,
        movie,
        showtime,
        cinemaName: cinema.name,
        roomName,
        seats: selectedSeats,
        totalAmount,
        expiraEn: result.expiraEn,
      })

      toast({
        title: '¡Agregado al carrito!',
        description: `${selectedSeats.length} asiento${selectedSeats.length !== 1 ? 's' : ''} reservado${selectedSeats.length !== 1 ? 's' : ''}. Tienes hasta que expire la reserva para pagar.`,
      })

      navigate('/')

    } catch (err: unknown) {
      const isConflict = (err as { status?: number })?.status === 409
      const apiMessage = (err as { message?: string })?.message

      toast({
        variant: 'destructive',
        title: isConflict ? 'Asiento no disponible' : 'Error',
        description: isConflict
          ? apiMessage || 'Uno o más asientos ya están bloqueados u ocupados.'
          : apiMessage || 'No se pudo reservar los asientos. Intenta de nuevo.',
      })
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <h1 className="mb-1 text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
        Selecciona tus asientos
      </h1>

      {showtime && (
  <p className="mb-8 text-sm text-muted-foreground">
    {cinemaName} — {formatTime(showtime.startTime)} — {PROJECTION_LABELS[showtime.projectionType]} — Q{showtime.price} por asiento
  </p>
)}

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          {showtimeId && <SeatMap showtimeId={showtimeId} />}
        </div>

        <div className="lg:w-72">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Resumen</h2>

            {selectedSeats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Haz clic en un asiento verde para seleccionarlo.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex items-center justify-between text-sm">
                      <span>Asiento {seat.row}{seat.column}</span>
                      <span className="text-muted-foreground">Q{showtime?.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>Q{totalAmount.toFixed(2)}</span>
                </div>
              </>
            )}

            <Button
              className="mt-5 w-full gap-2"
              disabled={selectedSeats.length === 0 || isBlocking}
              onClick={handleAddToCart}
            >
              {isBlocking ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Reservando...</>
              ) : (
                <><ShoppingCart className="h-4 w-4" />Agregar al carrito</>
              )}
            </Button>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              Los asientos se bloquean 10 min al agregar al carrito.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}