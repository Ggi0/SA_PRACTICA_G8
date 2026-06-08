import { useState } from 'react'
import { Plus, Pencil, Trash2, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MOCK_MOVIES } from '@/services/mock/mockData'
import type { Movie, MovieCategory } from '@/types'

const CATEGORY_LABELS: Record<MovieCategory, string> = {
  ESTRENO: 'Estreno',
  PRE_VENTA: 'Pre-venta',
  RE_ESTRENO: 'Re-estreno',
}

const CATEGORY_VARIANTS = {
  ESTRENO: 'estreno' as const,
  PRE_VENTA: 'preventa' as const,
  RE_ESTRENO: 'reestreno' as const,
}

const EMPTY_FORM = {
  title: '',
  synopsis: '',
  duration: '',
  rating: 'PG-13',
  category: 'ESTRENO' as MovieCategory,
  genre: '',
  releaseDate: '',
}

export function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleEdit = (movie: Movie) => {
    setEditingId(movie.id)
    setForm({
      title: movie.title,
      synopsis: movie.synopsis,
      duration: String(movie.duration),
      rating: movie.rating,
      category: movie.category,
      genre: movie.genre.join(', '),
      releaseDate: movie.releaseDate,
    })
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id))
  }

  const handleSubmit = () => {
    if (!form.title || !form.duration) return

    if (editingId) {
      setMovies((prev) => prev.map((m) =>
        m.id === editingId
          ? {
              ...m,
              title: form.title,
              synopsis: form.synopsis,
              duration: Number(form.duration),
              rating: form.rating,
              category: form.category,
              genre: form.genre.split(',').map((g) => g.trim()),
              releaseDate: form.releaseDate,
            }
          : m
      ))
    } else {
      const newMovie: Movie = {
        id: `m${Date.now()}`,
        title: form.title,
        synopsis: form.synopsis,
        duration: Number(form.duration),
        rating: form.rating,
        category: form.category,
        genre: form.genre.split(',').map((g) => g.trim()),
        releaseDate: form.releaseDate,
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop',
      }
      setMovies((prev) => [...prev, newMovie])
    }

    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const handleCancel = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Gestión de Películas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {movies.length} películas en cartelera
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva película
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">
            {editingId ? 'Editar película' : 'Nueva película'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Título de la película" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="synopsis">Sinopsis</Label>
              <textarea
                id="synopsis" name="synopsis"
                value={form.synopsis} onChange={handleChange}
                placeholder="Descripción de la película"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration">Duración (min)</Label>
              <Input id="duration" name="duration" type="number" value={form.duration} onChange={handleChange} placeholder="120" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rating">Clasificación</Label>
              <select
                id="rating" name="rating"
                value={form.rating} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option>G</option>
                <option>PG</option>
                <option>PG-13</option>
                <option>R</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category" name="category"
                value={form.category} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ESTRENO">Estreno</option>
                <option value="PRE_VENTA">Pre-venta</option>
                <option value="RE_ESTRENO">Re-estreno</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="releaseDate">Fecha de estreno</Label>
              <Input id="releaseDate" name="releaseDate" type="date" value={form.releaseDate} onChange={handleChange} />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="genre">Géneros (separados por coma)</Label>
              <Input id="genre" name="genre" value={form.genre} onChange={handleChange} placeholder="Acción, Drama, Ciencia Ficción" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit}>
              {editingId ? 'Guardar cambios' : 'Agregar película'}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
          </div>

          {/* Nota de implementación */}
          <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-2">
            ⚠️ <strong>Pendiente de integración:</strong> Este formulario deberá conectarse a{' '}
            <code>POST /api/movies</code> del movies-service cuando esté implementado.
          </p>
        </div>
      )}

      {/* Tabla de películas */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Título</th>
              <th className="text-left px-4 py-3 font-medium">Categoría</th>
              <th className="text-left px-4 py-3 font-medium">Duración</th>
              <th className="text-left px-4 py-3 font-medium">Clasificación</th>
              <th className="text-left px-4 py-3 font-medium">Géneros</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{movie.title}</td>
                <td className="px-4 py-3">
                  <Badge variant={CATEGORY_VARIANTS[movie.category]}>
                    {CATEGORY_LABELS[movie.category]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{movie.duration} min</td>
                <td className="px-4 py-3 text-muted-foreground">{movie.rating}</td>
                <td className="px-4 py-3 text-muted-foreground">{movie.genre.join(', ')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(movie)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(movie.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movies.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <Film className="mx-auto h-8 w-8 mb-2 opacity-30" />
            No hay películas registradas.
          </div>
        )}
      </div>
    </div>
  )
}