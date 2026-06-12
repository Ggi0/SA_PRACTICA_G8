import { useNavigate } from 'react-router-dom'
import { Film } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <Film className="h-16 w-16 text-muted-foreground/30" />
      <h1 className="mt-4 text-6xl font-bold text-muted-foreground/30">404</h1>
      <h2 className="mt-2 text-xl font-semibold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
        Página no encontrada
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Volver al inicio
      </Button>
    </div>
  )
}