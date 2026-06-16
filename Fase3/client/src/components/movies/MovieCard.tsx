
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

const POSTER_FALLBACK = 'https://i.pinimg.com/736x/b4/c1/ae/b4c1ae6ddc3849e442c52da5f9adb12e.jpg'

export function MovieCard({ movie }: MovieCardProps) {
  const category = CATEGORY_CONFIG[movie.category]

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{ backgroundColor: '#1a1a1a' }}>

      {/* Poster */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3', maxHeight: '280px' }}>
        <img
          src={movie.posterUrl || POSTER_FALLBACK}
          alt={`Poster de ${movie.title}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = POSTER_FALLBACK }}
        />

        {/* Gradiente inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Badge categoría */}
        <div className="absolute left-2 top-2">
          <Badge variant={category.variant}>{category.label}</Badge>
        </div>

        {/* Rating */}
        <div className="absolute right-2 top-2">
          <span className="rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {movie.rating}
          </span>
        </div>

        {/* Título sobre el gradiente */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            {movie.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <Clock className="h-3 w-3" />
              <span>{movie.duration} min</span>
            </div>
            <span className="text-white/40 text-xs">·</span>
            <span className="text-white/60 text-xs truncate">
              {movie.genre.slice(0, 1).join('')}
            </span>
          </div>
        </div>
      </div>

      {/* Botón */}
      <div className="p-3">
        <Button asChild size="sm" className="w-full text-xs">
          <Link to={`/movies/${movie.id}`}>
            {movie.category === 'PRE_VENTA' ? 'Pre-comprar' : 'Ver funciones'}
          </Link>
        </Button>
      </div>
    </article>
  )
}