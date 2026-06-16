import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ShowtimeSelector } from '@/components/movies/ShowtimeSelector'
import { useMovie } from '@/hooks/useMovieData'

const CATEGORY_CONFIG = {
  ESTRENO: { label: 'Estreno', variant: 'estreno' as const },
  PRE_VENTA: { label: 'Pre-venta', variant: 'preventa' as const },
  RE_ESTRENO: { label: 'Re-estreno', variant: 'reestreno' as const },
}

export function MovieDetailPage() {
  const { movieId } = useParams<{ movieId: string }>()
  const navigate = useNavigate()
  const { data: movie, isLoading } = useMovie(movieId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="h-64 w-44 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Película no encontrada.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>
          Volver a la cartelera
        </Button>
      </div>
    )
  }

  const category = CATEGORY_CONFIG[movie.category]

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cartelera
        </Button>

        {/* Info de la película */}
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="shrink-0">
            <img
              src={movie.posterUrl}
              alt={`Poster de ${movie.title}`}
              className="w-40 rounded-lg shadow-md md:w-48"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={category.variant}>{category.label}</Badge>
                <span className="rounded border border-border px-1.5 py-0.5 text-xs">
                  {movie.rating}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                {movie.title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{movie.duration} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{new Date(movie.releaseDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {movie.genre.map((g) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{movie.synopsis}</p>
          </div>
        </div>

        {/* Funciones */}
        <div className="mt-10">
          <h2 className="mb-6 text-xl font-semibold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Funciones disponibles
          </h2>
          <ShowtimeSelector movieId={movie.id} />
        </div>
      </div>
    </div>
  )
}