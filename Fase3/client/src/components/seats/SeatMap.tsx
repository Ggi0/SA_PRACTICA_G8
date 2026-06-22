import { useCheckoutStore } from '@/context/checkoutStore'
import { useSeats } from '@/hooks/useMovieData'
import { Skeleton } from '@/components/ui/skeleton'
import type { Seat, SeatStatus } from '@/types'
import { cn } from '@/lib/utils'

interface SeatMapProps {
  showtimeId: string
}

// ─── Botón individual de asiento ──────────────────────────────────────────────
interface SeatButtonProps {
  seat: Seat
  isSelected: boolean
  onToggle: (seat: Seat) => void
}

function SeatButton({ seat, isSelected, onToggle }: SeatButtonProps) {
  const isUnavailable = seat.status === 'OCCUPIED' || seat.status === 'BLOCKED_TEMP'

  return (
    <button
      type="button"
      aria-label={`Asiento ${seat.row}${seat.column}`}
      disabled={isUnavailable}
      onClick={() => !isUnavailable && onToggle(seat)}
      className={cn(
        'h-7 w-7 rounded-t-lg text-[10px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        seat.status === 'AVAILABLE' && !isSelected &&
          'bg-[hsl(var(--seat-available))] text-white hover:scale-110 cursor-pointer',
        isSelected &&
          'bg-[hsl(var(--seat-selected))] text-white scale-110 ring-2 ring-primary ring-offset-1',
        seat.status === 'OCCUPIED' &&
          'bg-[hsl(var(--seat-occupied))] text-white/60 cursor-not-allowed opacity-60',
        seat.status === 'BLOCKED_TEMP' &&
          'bg-[hsl(var(--seat-blocked))] text-white cursor-not-allowed opacity-80',
          seat.status === 'EN_USO' &&
  'bg-blue-500 text-white cursor-not-allowed opacity-90',

      )}
    >
      {seat.column}
    </button>
  )
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────
function SeatLegend() {
  const items: { status: SeatStatus; label: string; color: string }[] = [
    { status: 'AVAILABLE', label: 'Disponible', color: 'bg-[hsl(var(--seat-available))]' },
    { status: 'OCCUPIED', label: 'Ocupado', color: 'bg-[hsl(var(--seat-occupied))] opacity-60' },
    { status: 'SELECTED', label: 'Seleccionado', color: 'bg-[hsl(var(--seat-selected))]' },
    { status: 'BLOCKED_TEMP', label: 'Reservado temporalmente', color: 'bg-[hsl(var(--seat-blocked))]' },
    { status: 'EN_USO', label: 'En uso', color: 'bg-blue-500' },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
      {items.map(({ status, label, color }) => (
        <div key={status} className="flex items-center gap-1.5">
          <div className={cn('h-4 w-4 rounded-t-sm', color)} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function SeatMap({ showtimeId }: SeatMapProps) {
  const { data: seats = [], isLoading } = useSeats(showtimeId)
  const { selectedSeats, toggleSeat } = useCheckoutStore()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2 justify-center">
            {Array.from({ length: 10 }).map((_, j) => (
              <Skeleton key={j} className="h-7 w-7 rounded-t-lg" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  const rows = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = []
    acc[seat.row].push(seat)
    return acc
  }, {})

  const selectedIds = new Set(selectedSeats.map((s) => s.id))

  return (
    <div className="space-y-6">
      {/* Indicador de pantalla */}
      <div className="flex flex-col items-center gap-1">
        <div className="h-1.5 w-64 rounded-full bg-primary/20" />
        <span className="text-xs text-muted-foreground">PANTALLA</span>
      </div>

      {/* Grilla de asientos */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col items-center gap-2 px-4">
          {Object.entries(rows)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([rowLabel, rowSeats]) => (
              <div key={rowLabel} className="flex items-center gap-2">
                <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                  {rowLabel}
                </span>
                <div className="flex gap-1.5">
                  {rowSeats
                    .sort((a, b) => a.column - b.column)
                    .map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedIds.has(seat.id)}
                        onToggle={toggleSeat}
                      />
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <SeatLegend />
    </div>
  )
}