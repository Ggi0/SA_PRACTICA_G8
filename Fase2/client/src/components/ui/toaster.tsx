import * as React from 'react'
import { Toast } from './toast'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

// ─── Estado global de toasts ──────────────────────────────────────────────────
// Usamos un patrón simple de listeners para evitar un Context extra
let listeners: Array<(toasts: ToastData[]) => void> = []
let toasts: ToastData[] = []

function emitChange() {
  listeners.forEach((l) => l(toasts))
}

// ─── Función toast() — se importa y llama desde cualquier componente ──────────
export function toast(data: Omit<ToastData, 'id'>) {
  const id = `toast-${Date.now()}`
  toasts = [{ ...data, id }, ...toasts].slice(0, 3)
  emitChange()

  // Auto-cierra después de 4 segundos
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emitChange()
  }, 4000)
}

// ─── Hook para leer el estado de toasts ───────────────────────────────────────
export function useToast() {
  const [state, setState] = React.useState<ToastData[]>(toasts)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  }, [])

  return { toasts: state, toast }
}

// ─── Componente Toaster — se coloca una sola vez en MainLayout ────────────────
export function Toaster() {
  const { toasts: activeToasts } = useToast()

  const handleClose = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    emitChange()
  }

  if (activeToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {activeToasts.map((t) => (
        <Toast key={t.id} {...t} onClose={handleClose} />
      ))}
    </div>
  )
}