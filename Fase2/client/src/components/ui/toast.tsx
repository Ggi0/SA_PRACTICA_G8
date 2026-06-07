import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  onClose: (id: string) => void
}

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 shadow-lg',
        variant === 'destructive'
          ? 'border-destructive bg-destructive text-destructive-foreground'
          : 'border-border bg-background text-foreground'
      )}
    >
      <div className="grid gap-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="rounded-md p-1 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}