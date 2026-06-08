import { useState } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MOCK_MOVIES, MOCK_CINEMAS, MOCK_CITIES } from '@/services/mock/mockData'
import type { Showtime, ProjectionType } from '@/types'

const PROJECTION_TYPES: ProjectionType[] = ['STANDARD', '3D', 'IMAX', '4DX']

const EMPTY_FORM = {
  movieId: MOCK_MOVIES[0].id,
  cityId: MOCK_CITIES[0].id,
  cinemaId: '',
  startTime: '',
  projectionType: 'STANDARD' as ProjectionType,
  price: '',
}

// Funciones iniciales de ejemplo
const INITIAL_FUNCTIONS: Showtime[] = [
  { id: 'st1', movieId: 'm1', roomId: 'r1', cinemaId: 'cin1', cityId: 'city1', startTime: '2026-06-08T14:00:00', projectionType: 'IMAX', price: 85 },
  { id: 'st2', movieId: 'm1', roomId: 'r2', cinemaId: 'cin1', cityId: 'city1', startTime: '2026-06-08T18:30:00', projectionType: 'STANDARD', price: 60 },
  { id: 'st4', movieId: 'm2', roomId: 'r4', cinemaId: 'cin2', cityId: 'city1', startTime: '2026-06-08T16:00:00', projectionType: 'STANDARD', price: 60 },
]

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export function AdminFunctionsPage() {
  const [functions, setFunctions] = useState<Showtime[]>(INITIAL_FUNCTIONS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Filtra cines según la ciudad seleccionada
  const availableCinemas = MOCK_CINEMAS.filter((c) => c.cityId === form.cityId)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // Si cambia la ciudad, resetea el cine
      ...(name === 'cityId' ? { cinemaId: '' } : {}),
    }))
  }

  const handleSubmit = () => {
    if (!form.movieId || !form.cinemaId || !form.startTime || !form.price) return

    const newFunction: Showtime = {
      id: `st${Date.now()}`,
      movieId: form.movieId,
      roomId: `r${Date.now()}`,
      cinemaId: form.cinemaId,
      cityId: form.cityId,
      startTime: new Date(form.startTime).toISOString(),
      projectionType: form.projectionType,
      price: Number(form.price),
    }

    setFunctions((prev) => [...prev, newFunction])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Gestión de Funciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {functions.length} funciones programadas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva función
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Nueva función</h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Película */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="movieId">Película</Label>
              <select
                id="movieId" name="movieId"
                value={form.movieId} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MOCK_MOVIES.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5">
              <Label htmlFor="cityId">Ciudad</Label>
              <select
                id="cityId" name="cityId"
                value={form.cityId} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MOCK_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Cine */}
            <div className="space-y-1.5">
              <Label htmlFor="cinemaId">Cine</Label>
              <select
                id="cinemaId" name="cinemaId"
                value={form.cinemaId} onChange={handleChange}
                disabled={!form.cityId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">Selecciona un cine</option>
                {availableCinemas.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Fecha y hora */}
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Fecha y hora</Label>
              <Input
                id="startTime" name="startTime"
                type="datetime-local"
                value={form.startTime} onChange={handleChange}
              />
            </div>

            {/* Tipo de proyección */}
            <div className="space-y-1.5">
              <Label htmlFor="projectionType">Tipo de proyección</Label>
              <select
                id="projectionType" name="projectionType"
                value={form.projectionType} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PROJECTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Precio */}
            <div className="space-y-1.5">
              <Label htmlFor="price">Precio (Q)</Label>
              <Input
                id="price" name="price"
                type="number" min="0"
                value={form.price} onChange={handleChange}
                placeholder="60"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit}>Agregar función</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            ⚠️ <strong>Pendiente de integración:</strong> Este formulario deberá conectarse a{' '}
            <code>POST /api/movies/functions</code> del movies-service cuando esté implementado.
          </p>
        </div>
      )}

      {/* Tabla de funciones */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Película</th>
              <th className="text-left px-4 py-3 font-medium">Ciudad</th>
              <th className="text-left px-4 py-3 font-medium">Cine</th>
              <th className="text-left px-4 py-3 font-medium">Fecha y hora</th>
              <th className="text-left px-4 py-3 font-medium">Proyección</th>
              <th className="text-left px-4 py-3 font-medium">Precio</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {functions.map((fn) => {
              const movie = MOCK_MOVIES.find((m) => m.id === fn.movieId)
              const cinema = MOCK_CINEMAS.find((c) => c.id === fn.cinemaId)
              const city = MOCK_CITIES.find((c) => c.id === fn.cityId)
              return (
                <tr key={fn.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{movie?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{city?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{cinema?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(fn.startTime)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{fn.projectionType}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">Q{fn.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(fn.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {functions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Calendar className="mx-auto h-8 w-8 mb-2 opacity-30" />
            No hay funciones programadas.
          </div>
        )}
      </div>
    </div>
  )
}