import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Ticket,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toaster'

import {
  getMyReservations,
  confirmReservation,
  cancelReservation,
  type MyReservationItem,
} from '@/services/api/reservationService'

const STATUS_CONFIG = {
  PENDIENTE: {
    label: 'Pendiente',
    variant: 'outline' as const,
  },
  CONFIRMADA: {
    label: 'Confirmada',
    variant: 'default' as const,
  },
  CANCELADA: {
    label: 'Cancelada',
    variant: 'destructive' as const,
  },
}

export function ReservationsPage() {
  const navigate = useNavigate()

  const [reservations, setReservations] = useState<MyReservationItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReservations = async () => {
    try {
      const data = await getMyReservations()
      setReservations(data)
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message

      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          message || 'No se pudieron cargar las reservaciones',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const handleConfirm = async (id: string) => {
    try {
      await confirmReservation(id)

      toast({
        title: 'Reserva confirmada ✅',
      })

      fetchReservations()
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message

      toast({
        variant: 'destructive',
        title: 'Error al confirmar',
        description:
          message || 'No se pudo confirmar la reserva',
      })
    }
  }

  // #444130a6-b222-4c62-a4fa-f0ca09495989
 /// Reserva #444130a6-b222-4c62-a4fa-f0ca09495989

  const handleCancel = async (id: string) => {
    try {
      await cancelReservation(id)

      toast({
        title: 'Reserva cancelada ❌',
      })

      fetchReservations()
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message

      toast({
        variant: 'destructive',
        title: 'Error al cancelar',
        description:
          message || 'No se pudo cancelar la reserva',
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="mb-6 h-8 w-32" />

        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <Skeleton
              key={item}
              className="h-32 w-full rounded-lg"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily:
              'Playfair Display, Georgia, serif',
          }}
        >
          Mis Reservaciones
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {reservations.length}{' '}
          {reservations.length === 1
            ? 'reservación encontrada'
            : 'reservaciones encontradas'}
        </p>
      </div>

      {reservations.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Ticket className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

          <h2 className="text-lg font-semibold">
            No tienes reservaciones
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Cuando realices una compra aparecerá aquí.
          </p>

          <Button
            className="mt-6"
            onClick={() => navigate('/')}
          >
            Ir a cartelera
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {reservations.map((reservation) => {
          const status =
            STATUS_CONFIG[
              reservation.estado as keyof typeof STATUS_CONFIG
            ]

          return (
            <div
              key={reservation.id}
              className="rounded-lg border border-border bg-card p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={status?.variant}>
                      {status?.label ??
                        reservation.estado}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
                      #{reservation.id}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      Reserva #{reservation.id}
                    </h3>
                  </div>

                  <Separator />

                  <div className="grid gap-3 text-sm md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Total: Q
                        {Number(
                          reservation.precioTotal,
                        ).toFixed(2)}
                      </span>
                    </div>

                    {reservation.fechaCreacion && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />

                        <span>
                          {new Date(
                            reservation.fechaCreacion,
                          ).toLocaleString('es-GT')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {reservation.estado === 'PENDIENTE' && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() =>
                        handleConfirm(reservation.id)
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleCancel(reservation.id)
                      }
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}