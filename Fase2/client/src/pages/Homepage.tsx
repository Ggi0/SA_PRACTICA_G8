import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, MapPin } from 'lucide-react'
import { MovieGrid } from '@/components/movies/MoviesGrid'
import { Button } from '@/components/ui/button'
import { useMovies, useCities, useCinemas } from '@/hooks/useMovieData'
import { useAuth } from '@/context/AuthContext'
import { useCheckoutStore } from '@/context/checkoutStore'
import type { MovieCategory } from '@/types'
import { cn } from '@/lib/utils'

const TABS: { label: string; value: MovieCategory | 'ALL' }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Estrenos', value: 'ESTRENO' },
  { label: 'Pre-ventas', value: 'PRE_VENTA' },
  { label: 'Re-estrenos', value: 'RE_ESTRENO' },
]

// Imagen de sala de cine para el banner
const BANNER_IMAGE = 'https://i.pinimg.com/736x/ba/41/3b/ba413bc9fb77b13574c82db6d08a99b8.jpg'

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<MovieCategory | 'ALL'>('ALL')
  const { selectedCity, setCity } = useCheckoutStore()
  const [selectedCinema, setSelectedCinema] = useState<string | null>(null)

  const { data: movies = [], isLoading } = useMovies(
    activeTab === 'ALL' ? undefined : activeTab
  )
  const { data: cities = [] } = useCities()
  const { data: cinemas = [] } = useCinemas(selectedCity)

  const selectedCityName = cities.find((c) => c.id === selectedCity)?.name
  const selectedCinemaName = cinemas.find((c) => c.id === selectedCinema)?.name

  return (
    <div className="min-h-screen">

      {/* ── Banner ── */}
      <section className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={BANNER_IMAGE}
          alt="Sala de cine"
          className="h-full w-full  object-cover"
        />
        {/* Overlay oscuro con color primario */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-xl">
              <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl"
                style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                Tu cine,<br />a un clic.
              </h1>
              <p className="mt-3 text-base text-white/80">
                Selecciona tu ciudad, elige tu función y reserva tus asientos en segundos.
              </p>
              {!isAuthenticated && (
                <div className="mt-6 flex gap-3">
                  <Button asChild size="lg" className="bg-primary hover:bg-secondary">
                    <Link to="/register">
                      <Ticket className="mr-2 h-5 w-5" />
                      Comenzar
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-white text-white hover:bg-white/10 hover:text-white">
                    <Link to="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
{/* ── Selector ciudad → cine ── */}
      {isAuthenticated && (
        <section className="border-b border-border shadow-sm" style={{ backgroundColor: '#1B1717' }}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">

              {/* Ícono */}
              <MapPin className="h-4 w-4 text-primary shrink-0" />

              {/* Ciudades */}
              <div className="flex flex-wrap gap-2">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => { setCity(city.id); setSelectedCinema(null) }}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
                      selectedCity === city.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary hover:text-primary'
                    )}
                  >
                    {city.name}
                  </button>
                ))}
              </div>

             
            </div>

            {/* Resumen de selección */}
            {selectedCityName && (
              <p className="mt-2 text-xs text-muted-foreground">
                Mostrando funciones en <strong>{selectedCityName}</strong>
                {selectedCinemaName && <> → <strong>{selectedCinemaName}</strong></>}
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Cartelera ── */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Cartelera
          </h2>

          {/* Tabs de categoría */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <MovieGrid movies={movies} isLoading={isLoading} />
      </section>
    </div>
  )
}