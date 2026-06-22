import { useState } from 'react'
import { CreditCard, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toaster'
import { confirmReservation } from '@/services/api/reservationService'
import { useCartStore } from '@/context/cartStore'
import { useCheckoutStore } from '@/context/checkoutStore'
import type { Ticket } from '@/types'

interface PaymentFormProps {
  totalAmount: number
}

export function PaymentForm({ totalAmount }: PaymentFormProps) {
  const { items, clearCart } = useCartStore()
  const { setTicket } = useCheckoutStore()
  const [isProcessing, setIsProcessing] = useState(false)

  const [fields, setFields] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  })

  const [errors, setErrors] = useState<Partial<typeof fields>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<typeof fields> = {}

    if (fields.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Número inválido'
    }
    if (fields.cardHolder.trim().length < 3) {
      newErrors.cardHolder = 'Ingresa el nombre del titular'
    }
    if (!fields.expiryMonth || +fields.expiryMonth < 1 || +fields.expiryMonth > 12) {
      newErrors.expiryMonth = 'MM inválido'
    }
    if (!fields.expiryYear || fields.expiryYear.length < 2) {
      newErrors.expiryYear = 'AA inválido'
    }
    if (fields.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatShowtime = (iso: string) =>
    new Date(iso).toLocaleString('es-GT', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })

  const handleSubmit = async () => {
    if (!validate() || items.length === 0) return

    setIsProcessing(true)
    try {
      // Confirma en el backend cada reserva del carrito
      await Promise.all(items.map((item) => confirmReservation(item.id)))

      // Se usa el primer ítem como referencia principal del boleto.
      // Si más adelante un carrito agrupa varias funciones distintas,
      // esto debería generar un ticket por función en vez de uno solo.
      const primaryItem = items[0]

      const allSeatLabels = items.flatMap((item) =>
        item.seats.map((seat) => `${seat.row}${seat.column}`)
      )

      const ticket: Ticket = {
        id: `TKT-${primaryItem.id}`,
        reservationId: primaryItem.id, // se conserva el id real de la reserva, sin transformar, para el QR
        movieTitle: primaryItem.movie.title,
        cinemaName: primaryItem.cinemaName,
        roomName: primaryItem.roomName,    // ⚠️ idem
        showtime: formatShowtime(primaryItem.showtime.startTime),
        seats: allSeatLabels,
        totalAmount,
      }

      setTicket(ticket) // también mueve checkoutStore.step a 'confirmation'
      clearCart()

      toast({
        title: '¡Pago enviado correctamente!',
        description: 'Tus reservaciones fueron confirmadas.',
      })
    } catch (err: unknown) {
      const apiMessage = (err as { message?: string })?.message
      toast({
        variant: 'destructive',
        title: 'Error',
        description: apiMessage || 'Ocurrió un problema al confirmar la reservación.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCardNumber = (value: string) =>
    value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Pago seguro simulado — datos de prueba</span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardNumber">Número de tarjeta</Label>
        <div className="relative">
          <Input
            id="cardNumber"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(fields.cardNumber)}
            onChange={handleChange}
            maxLength={19}
            className={errors.cardNumber ? 'border-destructive' : ''}
          />
          <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
        {errors.cardNumber && <p className="text-xs text-destructive">{errors.cardNumber}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cardHolder">Nombre en la tarjeta</Label>
        <Input
          id="cardHolder"
          name="cardHolder"
          placeholder="NOMBRE APELLIDO"
          value={fields.cardHolder}
          onChange={handleChange}
          className={errors.cardHolder ? 'border-destructive' : ''}
        />
        {errors.cardHolder && <p className="text-xs text-destructive">{errors.cardHolder}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expiryMonth">Mes</Label>
          <Input
            id="expiryMonth"
            name="expiryMonth"
            placeholder="MM"
            maxLength={2}
            value={fields.expiryMonth}
            onChange={handleChange}
            className={errors.expiryMonth ? 'border-destructive' : ''}
          />
          {errors.expiryMonth && <p className="text-xs text-destructive">{errors.expiryMonth}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiryYear">Año</Label>
          <Input
            id="expiryYear"
            name="expiryYear"
            placeholder="AA"
            maxLength={2}
            value={fields.expiryYear}
            onChange={handleChange}
            className={errors.expiryYear ? 'border-destructive' : ''}
          />
          {errors.expiryYear && <p className="text-xs text-destructive">{errors.expiryYear}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            name="cvv"
            placeholder="123"
            maxLength={4}
            value={fields.cvv}
            onChange={handleChange}
            className={errors.cvv ? 'border-destructive' : ''}
          />
          {errors.cvv && <p className="text-xs text-destructive">{errors.cvv}</p>}
        </div>
      </div>

      <div className="rounded-lg bg-muted px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total a pagar</span>
        <span className="text-lg font-bold">Q{totalAmount.toFixed(2)}</span>
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirmando reservación...
          </>
        ) : (
          `Pagar Q${totalAmount.toFixed(2)}`
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Usa cualquier número de 16 dígitos para la simulación.
      </p>
    </div>
  )
}