import { ShoppingCart, Trash2, Clock, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/context/cartStore'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/context/cartStore'

// ─── Countdown por item ───────────────────────────────────────────────────────
function Countdown({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = expiresAt.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expirado'); return }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const isUrgent = expiresAt.getTime() - Date.now() < 2 * 60 * 1000

  return (
    <span className={`flex items-center gap-1 text-xs ${isUrgent ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
      <Clock className="h-3 w-3" />
      {timeLeft}
    </span>
  )
}

// ─── Item del carrito ─────────────────────────────────────────────────────────
function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem } = useCartStore()

  return (
    <div className="p-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.movie.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.seats.map((s) => `${s.row}${s.column}`).join(', ')}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(item.showtime.startTime).toLocaleString('es-GT', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <Countdown expiresAt={item.expiresAt} />
            <span className="text-sm font-semibold">Q{item.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-muted-foreground hover:text-destructive transition-colors mt-0.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Carrito principal ────────────────────────────────────────────────────────
export function CartIcon() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { items, totalAmount } = useCartStore()

  const handleCheckout = () => {
    setOpen(false)
    navigate('/checkout')
  }

  return (
    <div className="relative">
      {/* Botón del carrito */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full text-white hover:bg-white/10 transition-colors"
      >
        <ShoppingCart className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: '#810100' }}>
            {items.length}
          </span>
        )}
      </button>

      {/* Dropdown del carrito */}
      {open && (
        <>
          {/* Overlay para cerrar */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">
                Mi carrito ({items.length})
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-30" />
                Tu carrito está vacío
              </div>
            ) : (
              <>
                <div className="max-h-72 overflow-y-auto">
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </div>

                {/* Footer con total y botón */}
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>Q{totalAmount().toFixed(2)}</span>
                  </div>
                  <Button className="w-full" onClick={handleCheckout}>
                    Pagar todo
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Los asientos se liberan si no pagas a tiempo
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}