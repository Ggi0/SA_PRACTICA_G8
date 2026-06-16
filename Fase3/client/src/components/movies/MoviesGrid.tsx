import { MovieCard } from './MovieCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Movie } from '@/types'

interface MovieGridProps {
  movies: Movie[]
  isLoading?: boolean
}

function MovieCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border" style={{ backgroundColor: '#1e1e1e' }}>
      <Skeleton className="h-72 w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-7 w-full mt-1" />
      </div>
    </div>
  )
}

export function MovieGrid({ movies, isLoading = false }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p className="text-lg">No hay películas disponibles.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  )
}