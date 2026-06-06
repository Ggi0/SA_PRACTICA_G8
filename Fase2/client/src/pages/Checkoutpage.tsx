import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PaymentForm } from '@/components/checkout/PaymentForm'
import { useCheckoutStore } from '@/context/checkoutStore'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { selectedSeats, selectedShowtime, selectedMovie, reservationId, step } = useCheckoutStore()

  // Si el usuario llega aquí sin haber pasado por el flujo, lo redirige
  useEffect(() => {
    if (!reservationId) navigate('/', { replace: true })
  }, [reservationId, navigate])

  // Cuando el pago es exitoso el store cambia el step a 'confirmation'
  useEffect(() => {
    if (step === 'confirmation') navigate('/confirmation')
  }, [step, navigate])

  const totalAmount = selectedSeats.length * (selectedShowtime?.price ?? 0)

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('es-GT', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <h1 className="mb-8 text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
        Confirmar y pagar
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Formulario de pago */}
        <div className="flex-1">
          <PaymentForm totalAmount={totalAmount} />
        </div>

        {/* Resumen del pedido */}
        <div className="lg:w-80">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Tu pedido</h2>

            {selectedMovie && (
              <div className="flex gap-3">
                <img
                  src={selectedMovie.posterUrl}
                  alt={selectedMovie.title}
                  className="w-16 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{selectedMovie.title}</p>
                  {selectedShowtime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(selectedShowtime.startTime)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              {selectedSeats.map((seat) => (
                <div key={seat.id} className="flex justify-between text-sm">
                  <span>Asiento {seat.row}{seat.column}</span>
                  <span className="text-muted-foreground">Q{selectedShowtime?.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>Q{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}