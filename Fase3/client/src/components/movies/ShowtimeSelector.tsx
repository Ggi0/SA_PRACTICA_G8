import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useShowtimes, useCinemas } from '@/hooks/useMovieData'
import { useCheckoutStore } from '@/context/checkoutStore'
import type { Showtime } from '@/types'

interface ShowtimeSelectorProps {
  movieId: string
}

const PROJECTION_LABELS: Record<string, string> = {
  STANDARD: 'Estándar',
  '3D': '3D',
  IMAX: 'IMAX',
  '4DX': '4DX',
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function ShowtimeSelector({ movieId }: ShowtimeSelectorProps) {
  const navigate = useNavigate()
  const { selectedCity, selectShowtime } = useCheckoutStore()
  const { data: showtimes = [], isLoading } = useShowtimes(movieId, selectedCity)
  const { data: cinemas = [] } = useCinemas(selectedCity)

  const handleSelect = (showtime: Showtime) => {
    selectShowtime(showtime)
    navigate(`/showtimes/${showtime.id}/seats`)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    )
  }

  if (showtimes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        {selectedCity
          ? 'No hay funciones disponibles para esta ciudad.'
          : 'Selecciona una ciudad en la barra de navegación para ver las funciones.'}
      </div>
    )
  }

  // Agrupa funciones por cine
  const grouped = showtimes.reduce<Record<string, Showtime[]>>((acc, st) => {
    if (!acc[st.cinemaId]) acc[st.cinemaId] = []
    acc[st.cinemaId].push(st)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cinemaId, times]) => {
        const cinema = cinemas.find((c) => c.id === cinemaId)
        return (
          <div key={cinemaId}>
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-medium text-foreground">{cinema?.name ?? cinemaId}</span>
              <span>·</span>
              <span>{cinema?.address}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {times.map((showtime) => (
                <Button
                  key={showtime.id}
                  variant="outline"
                  className="flex h-auto flex-col items-start gap-1 px-4 py-3"
                  onClick={() => handleSelect(showtime)}
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(showtime.startTime)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="px-1.5 py-0 text-xs">
                      {PROJECTION_LABELS[showtime.projectionType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Q{showtime.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(showtime.startTime)}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}