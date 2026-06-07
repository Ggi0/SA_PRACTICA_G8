import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Film, MapPin, Clock, Armchair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCheckoutStore } from '@/context/checkoutStore'

export function ConfirmationPage() {
  const navigate = useNavigate()
  const { ticket, reset } = useCheckoutStore()

  // Si no hay ticket, redirige al inicio
  useEffect(() => {
    if (!ticket) navigate('/', { replace: true })
  }, [ticket, navigate])

  const handleGoHome = () => {
    reset()
    navigate('/')
  }

  if (!ticket) return null

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* Ícono de éxito */}
        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            ¡Pago exitoso!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu boleto ha sido emitido. ¡Disfruta la película!
          </p>
        </div>

        {/* Boleto */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          {/* Encabezado del boleto */}
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              <span className="font-semibold">CineMax</span>
            </div>
            <h2 className="mt-1 text-xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              {ticket.movieTitle}
            </h2>
          </div>

          {/* Detalles del boleto */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cine</p>
                <p className="text-sm font-medium">{ticket.cinemaName}</p>
                <p className="text-xs text-muted-foreground">{ticket.roomName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Función</p>
                <p className="text-sm font-medium">{ticket.showtime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Armchair className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Asientos</p>
                <p className="text-sm font-medium">{ticket.seats.join(', ')}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total pagado</span>
              <span className="text-lg font-bold">Q{ticket.totalAmount.toFixed(2)}</span>
            </div>

            <div className="rounded-md bg-muted px-3 py-2">
              <p className="text-xs text-muted-foreground">ID de reservación</p>
              <p className="text-sm font-mono font-medium">{ticket.reservationId}</p>
            </div>
          </div>
        </div>

        <Button className="mt-6 w-full" onClick={handleGoHome}>
          Volver a la cartelera
        </Button>
      </div>
    </div>
  )
}