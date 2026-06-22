import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PaymentForm } from '@/components/checkout/PaymentForm'
import { useCartStore } from '@/context/cartStore'
import { useCheckoutStore } from '@/context/checkoutStore'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalAmount } = useCartStore()
  const { step } = useCheckoutStore()

  // Si no hay items en el carrito, redirige al inicio
 // Si no hay items en el carrito Y no venimos de un pago exitoso, redirige al inicio
useEffect(() => {
  if (items.length === 0 && step !== 'confirmation') {
    navigate('/', { replace: true })
  }
}, [items.length, step, navigate])

  // Cuando el pago es exitoso navega a confirmación
  useEffect(() => {
    if (step === 'confirmation') navigate('/confirmation')
  }, [step, navigate])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('es-GT', {
      weekday: 'short', day: 'numeric', month: 'short',
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
          <PaymentForm totalAmount={totalAmount()} />
        </div>

        {/* Resumen del carrito */}
        <div className="lg:w-80">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Tu pedido ({items.length} {items.length === 1 ? 'función' : 'funciones'})</h2>

            {items.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator />}
                <div className="space-y-2 pt-2">
                  {/* Película */}
                  <div className="flex gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=60&h=90&fit=crop"
                      alt={item.movie.title}
                      className="w-12 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.movie.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(item.showtime.startTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.showtime.projectionType}
                      </p>
                    </div>
                  </div>

                  {/* Asientos */}
                  <div className="space-y-1">
                    {item.seats.map((seat) => (
                      <div key={seat.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>Asiento {seat.row}{seat.column}</span>
                        <span>Q{item.showtime.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tiempo restante */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Expira: {item.expiresAt.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal</span>
                    <span>Q{item.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>Q{totalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}