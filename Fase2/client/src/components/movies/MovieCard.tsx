import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Movie } from '@/types'

interface MovieCardProps {
  movie: Movie
}

const CATEGORY_CONFIG = {
  ESTRENO: { label: 'Estreno', variant: 'estreno' as const },
  PRE_VENTA: { label: 'Pre-venta', variant: 'preventa' as const },
  RE_ESTRENO: { label: 'Re-estreno', variant: 'reestreno' as const },
}

// Imagen de poster genérica cinematográfica para todas las películas
const POSTER_FALLBACK = 'https://i.pinimg.com/736x/b4/c1/ae/b4c1ae6ddc3849e442c52da5f9adb12e.jpg'

export function MovieCard({ movie }: MovieCardProps) {
  const category = CATEGORY_CONFIG[movie.category]

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1 w-48 shrink-0">

      {/* Poster */}
      <div className="relative overflow-hidden bg-muted" style={{ height: '288px' }}>
        <img
          src={POSTER_FALLBACK}
          alt={`Poster de ${movie.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradiente sobre el poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badge de categoría */}
        <div className="absolute left-2 top-2">
          <Badge variant={category.variant}>{category.label}</Badge>
        </div>

        {/* Rating */}
        <div className="absolute right-2 top-2">
          <span className="rounded bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
            {movie.rating}
          </span>
        </div>

        {/* Título sobre el gradiente */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            {movie.title}
          </h3>
        </div>
      </div>

      {/* Info debajo del poster */}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g) => (
            <span key={g} className="text-xs text-muted-foreground">{g}</span>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{movie.duration} min</span>
        </div>

        <Button asChild size="sm" className="mt-1 w-full text-xs">
          <Link to={`/movies/${movie.id}`}>
            {movie.category === 'PRE_VENTA' ? 'Pre-comprar' : 'Ver funciones'}
          </Link>
        </Button>
      </div>
    </article>
  )
}