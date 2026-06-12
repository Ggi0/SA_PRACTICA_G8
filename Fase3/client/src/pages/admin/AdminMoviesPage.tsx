import { useEffect, useState } from 'react'
import {
  Film,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import {
  getGenres,
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
} from '@/services/api/admin/moviesCRUD'

interface Genre {
  id: string
  nombre: string
}

interface Movie {
  id: string
  title: string
  synopsis: string
  posterUrl: string
  duration: number
  genre: string[]
  rating: string
  category: string
  releaseDate: string
}

const EMPTY_FORM = {
  titulo: '',
  sinopsis: '',
  duracion_min: '',
  clasificacion: 'PG-13',
  poster_url: '',
  fecha_estreno: '',
  tipo: 'ESTRENO',
  activa: true,
  generos: [] as string[],
}

export function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const [success, setSuccess] = useState('')
  const [lastMovieId, setLastMovieId] = useState<string>('')

  const loadData = async () => {
    const [moviesData, genresData] =
      await Promise.all([
        getMovies(),
        getGenres(),
      ])

    setMovies(moviesData)
    setGenres(genresData)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async () => {
    const payload = {
      ...form,
      duracion_min: Number(form.duracion_min),
    }

    try {
      if (editingId) {
        await updateMovie(editingId, payload)
        setSuccess('Película actualizada correctamente')
      } else {
        await createMovie(payload)

        const updatedMovies = await getMovies()

        setMovies(updatedMovies)

        const latest = updatedMovies[0]

        if (latest) {
          setLastMovieId(latest.id)
        }

        setSuccess('Película creada exitosamente')
      }

      await loadData()

      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('¿Eliminar película?')) return

    await deleteMovie(id)

    loadData()
  }

  const handleEdit = async (id: string) => {
    const movie = await getMovie(id)

    setEditingId(id)

    setForm({
      titulo: movie.titulo,
      sinopsis: movie.sinopsis,
      duracion_min: String(movie.duracion_min),
      clasificacion:
        movie.clasificacion ?? 'PG-13',
      poster_url: movie.poster_url ?? '',
      fecha_estreno:
        movie.fecha_estreno ?? '',
      tipo: movie.tipo,
      activa: true,
      generos: movie.generos.map(
        (g) => g.id,
      ),
    })

    setShowForm(true)
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Gestión de Películas
          </h1>

          <p className="text-muted-foreground">
            {movies.length} películas registradas
          </p>
        </div>

        <Button
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Película
        </Button>
      </div>

      {success && (
        <div className="border rounded-lg bg-green-50 text-green-700 p-4 flex gap-3">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {showForm && (
        <div className="grid lg:grid-cols-3 gap-6">

          {/* FORMULARIO */}

          <div className="lg:col-span-2 border rounded-lg p-6 bg-card">

            <h2 className="font-semibold text-lg mb-4">
              {editingId
                ? 'Editar película'
                : 'Nueva película'}
            </h2>

            <div className="space-y-4">

              <div>
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      titulo: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Sinopsis</Label>

                <textarea
                  rows={4}
                  value={form.sinopsis}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sinopsis: e.target.value,
                    })
                  }
                  className="w-full border rounded-md p-3"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <Label>Duración</Label>
                  <Input
                    type="number"
                    value={form.duracion_min}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duracion_min:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Clasificación</Label>

                  <Input
                    value={form.clasificacion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clasificacion:
                          e.target.value,
                      })
                    }
                  />
                </div>

              </div>

              <div>
                <Label>Poster URL</Label>

                <Input
                  value={form.poster_url}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      poster_url:
                        e.target.value,
                    })
                  }
                />
              </div>

              {form.poster_url && (
                <img
                  src={form.poster_url}
                  alt=""
                  className="w-40 rounded-lg border"
                />
              )}

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <Label>Fecha estreno</Label>

                  <Input
                    type="date"
                    value={form.fecha_estreno}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fecha_estreno:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Tipo</Label>

                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipo:
                          e.target.value,
                      })
                    }
                    className="w-full border rounded-md h-10 px-3"
                  >
                    <option>
                      ESTRENO
                    </option>
                    <option>
                      PRE_VENTA
                    </option>
                    <option>
                      RE_ESTRENO
                    </option>
                  </select>
                </div>

              </div>

              <div>
                <Label>Géneros</Label>

                <div className="grid grid-cols-2 gap-2 mt-2">

                  {genres.map((genre) => (
                    <label
                      key={genre.id}
                      className="flex gap-2 items-center"
                    >
                      <input
                        type="checkbox"
                        checked={form.generos.includes(
                          genre.id,
                        )}
                        onChange={() => {
                          const exists =
                            form.generos.includes(
                              genre.id,
                            )

                          setForm({
                            ...form,
                            generos: exists
                              ? form.generos.filter(
                                  (g) =>
                                    g !==
                                    genre.id,
                                )
                              : [
                                  ...form.generos,
                                  genre.id,
                                ],
                          })
                        }}
                      />

                      {genre.nombre}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">

                <Button
                  onClick={handleSubmit}
                >
                  {editingId
                    ? 'Guardar cambios'
                    : 'Crear película'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancelar
                </Button>

              </div>

            </div>
          </div>

          {/* PANEL LATERAL */}

          <div className="border rounded-lg p-6 bg-card">

            <h3 className="font-semibold mb-3">
              Última película creada
            </h3>

            {lastMovieId ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  ID generado:
                </p>

                <code className="block text-xs break-all bg-muted p-3 rounded">
                  {lastMovieId}
                </code>

                <Button
                  className="w-full mt-4"
                  onClick={() =>
                    handleEdit(lastMovieId)
                  }
                >
                  Obtener película
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Aún no se ha creado ninguna película.
              </p>
            )}
          </div>

        </div>
      )}

      {/* TABLA */}

      <div className="rounded-lg border overflow-hidden">

        <table className="w-full">

          <thead>
            <tr className="bg-muted border-b">
              <th className="p-4">Poster</th>
              <th className="p-4">Título</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Duración</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>

            {movies.map((movie) => (
              <tr
                key={movie.id}
                className="border-b"
              >
                <td className="p-4">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                </td>

                <td className="p-4">
                  <div className="font-medium">
                    {movie.title}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {movie.genre.join(', ')}
                  </div>
                </td>

                <td className="p-4">
                  <Badge>
                    {movie.category}
                  </Badge>
                </td>

                <td className="p-4">
                  {movie.duration} min
                </td>

                <td className="p-4">
                  <div className="flex gap-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleEdit(movie.id)
                      }
                    >
                      <Pencil size={14} />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDeleteMovie(
                          movie.id,
                        )
                      }
                    >
                      <Trash2 size={14} />
                    </Button>

                  </div>
                </td>
              </tr>
            ))}

          </tbody>
        </table>

        {movies.length === 0 && (
          <div className="py-10 text-center">
            <Film className="mx-auto mb-3 h-8 w-8 opacity-30" />
            No hay películas registradas
          </div>
        )}
      </div>
    </div>
  )
}