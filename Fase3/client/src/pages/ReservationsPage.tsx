import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Ticket,
  Clock,
  XCircle,
  CreditCard,
  Film,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'

import { cancelReservation } from '@/services/api/reservationService'
import { useCartStore } from '@/context/cartStore'

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCountdown(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now()
  if (ms <= 0) return 'Expirado'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ReservationsPage() {
  const navigate = useNavigate()
  const { items, removeItem } = useCartStore()

  // Fuerza un re-render cada segundo para que el contador de 10 min avance en pantalla
  const [, tick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id)
      removeItem(id)
      toast({ title: 'Reserva cancelada ❌' })
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message
      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description: message || 'No se pudo cancelar la reserva',
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Tu carrito
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'reservación pendiente de pago' : 'reservaciones pendientes de pago'}
          </p>
        </div>

        {items.length > 0 && (
          <Button onClick={() => navigate('/checkout')}>
            <CreditCard className="mr-2 h-4 w-4" />
            Proceder al pago
          </Button>
        )}
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Ticket className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecciona asientos en una función para agregarlos aquí.
          </p>
          <Button className="mt-6" onClick={() => navigate('/')}>
            Ir a cartelera
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{item.movie.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  {item.cinemaName} — {item.roomName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(item.showtime.startTime)}
                </p>

                <Separator />

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                    <span>Asientos: {item.seats.map((s) => `${s.row}${s.column}`).join(', ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Expira en: {formatCountdown(item.expiresAt)}</span>
                  </div>
                </div>

                <p className="text-sm font-medium">Total: Q{item.totalAmount.toFixed(2)}</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="destructive" onClick={() => handleCancel(item.id)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}