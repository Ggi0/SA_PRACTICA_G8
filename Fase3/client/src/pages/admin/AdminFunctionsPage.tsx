import { useEffect, useMemo, useState } from 'react'

import {
  CalendarDays,
  CheckCircle,
  Clock3,
  DoorOpen,
  Film,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Building2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import {
  createFuncion,
  deleteFuncion,
  getFuncion,
  getFunciones,
  getFuncionesByFecha,
  getFuncionesByMovie,
  getFuncionesBySala,
  getPeliculasList,
  getSalasList,
  updateFuncion,
  type Funcion,
  type FuncionPayload,
  type PeliculaOption,
  type SalaOption,
} from '@/services/api/admin/funcionesCRUD'

const EMPTY_FORM: FuncionPayload = {
  peliculaId: '',
  salaId: '',
  fechaHora: '',
  tipo: 'ESTRENO',
  activa: true,
}

export function AdminFunctionsPage() {
  const [funciones, setFunciones] =
    useState<Funcion[]>([])

  const [peliculas, setPeliculas] =
    useState<PeliculaOption[]>([])

  const [salas, setSalas] =
    useState<SalaOption[]>([])

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState('')

  const [form, setForm] =
    useState<FuncionPayload>(EMPTY_FORM)

  const [filters, setFilters] = useState({
    peliculaId: '',
    salaId: '',
    fecha: '',
  })

  const peliculasMap = useMemo(() => {
    return new Map(
      peliculas.map((p) => [p.id, p]),
    )
  }, [peliculas])

  const salasMap = useMemo(() => {
    return new Map(
      salas.map((s) => [s.id, s]),
    )
  }, [salas])

  function toDateInputValue(
    value: string,
  ): string {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime()))
      return ''

    const local =
      new Date(
        date.getTime() -
          date.getTimezoneOffset() *
            60000,
      )

    return local
      .toISOString()
      .slice(0, 16)
  }

  function formatDateTime(
    value: string,
  ): string {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime()))
      return value

    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function enrichFunciones(
    data: Funcion[],
  ): Funcion[] {
    return data.map((funcion) => {
      const peliculaId =
        funcion.pelicula?.id ?? ''
      const salaId = funcion.sala?.id ?? ''

      const pelicula =
        peliculaId
          ? peliculasMap.get(peliculaId)
          : undefined

      const sala = salaId
        ? salasMap.get(salaId)
        : undefined

      return {
        ...funcion,
        pelicula: {
          id:
            funcion.pelicula?.id ??
            pelicula?.id ??
            '',
          titulo:
            funcion.pelicula?.titulo ??
            pelicula?.titulo ??
            '-',
          tipo:
            funcion.pelicula?.tipo ??
            pelicula?.tipo ??
            '-',
        },
        sala: {
          id:
            funcion.sala?.id ??
            sala?.id ??
            '',
          nombre:
            funcion.sala?.nombre ??
            sala?.nombre ??
            '-',
          tipoSala:
            funcion.sala?.tipoSala ??
            sala?.tipoSala ??
            '-',
        },
        cine: {
          id:
            funcion.cine?.id ??
            sala?.cine?.id ??
            '',
          nombre:
            funcion.cine?.nombre ??
            sala?.cine?.nombre ??
            '-',
        },
      }
    })
  }

  async function loadCatalogs() {
    const [peliculasData, salasData] =
      await Promise.all([
        getPeliculasList(),
        getSalasList(),
      ])

    setPeliculas(peliculasData)
    setSalas(salasData)

    return {
      peliculasData,
      salasData,
    }
  }

  async function loadData() {
    const {
      peliculasData,
      salasData,
    } = await loadCatalogs()

    const peliculasLocalMap = new Map(
      peliculasData.map((p) => [p.id, p]),
    )

    const salasLocalMap = new Map(
      salasData.map((s) => [s.id, s]),
    )

    const funcionesData =
      await getFunciones()

    const enriched = funcionesData.map(
      (funcion) => {
        const peliculaId =
          funcion.pelicula?.id ?? ''
        const salaId =
          funcion.sala?.id ?? ''

        const pelicula =
          peliculaId
            ? peliculasLocalMap.get(
                peliculaId,
              )
            : undefined

        const sala = salaId
          ? salasLocalMap.get(salaId)
          : undefined

        return {
          ...funcion,
          pelicula: {
            id:
              funcion.pelicula?.id ??
              pelicula?.id ??
              '',
            titulo:
              funcion.pelicula?.titulo ??
              pelicula?.titulo ??
              '-',
            tipo:
              funcion.pelicula?.tipo ??
              pelicula?.tipo ??
              '-',
          },
          sala: {
            id:
              funcion.sala?.id ??
              sala?.id ??
              '',
            nombre:
              funcion.sala?.nombre ??
              sala?.nombre ??
              '-',
            tipoSala:
              funcion.sala?.tipoSala ??
              sala?.tipoSala ??
              '-',
          },
          cine: {
            id:
              funcion.cine?.id ??
              sala?.cine?.id ??
              '',
            nombre:
              funcion.cine?.nombre ??
              sala?.cine?.nombre ??
              '-',
          },
        }
      },
    )

    setFunciones(enriched)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function applyFilters(
    nextFilters = filters,
  ) {
    try {
      let baseData: Funcion[]

      if (nextFilters.fecha) {
        baseData =
          await getFuncionesByFecha(
            nextFilters.fecha,
          )
      } else if (nextFilters.salaId) {
        baseData =
          await getFuncionesBySala(
            nextFilters.salaId,
          )
      } else if (nextFilters.peliculaId) {
        baseData =
          await getFuncionesByMovie(
            nextFilters.peliculaId,
          )
      } else {
        baseData = await getFunciones()
      }

      let enriched =
        enrichFunciones(baseData)

      if (nextFilters.peliculaId) {
        enriched = enriched.filter(
          (f) =>
            f.pelicula?.id ===
            nextFilters.peliculaId,
        )
      }

      if (nextFilters.salaId) {
        enriched = enriched.filter(
          (f) =>
            f.sala?.id === nextFilters.salaId,
        )
      }

      if (nextFilters.fecha) {
        enriched = enriched.filter((f) =>
          (
            f.fechaHora ?? ''
          ).startsWith(nextFilters.fecha),
        )
      }

      setFunciones(enriched)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleSubmit() {
    try {
      if (
        !form.peliculaId ||
        !form.salaId ||
        !form.fechaHora ||
        !form.tipo
      ) {
        return
      }

      if (editingId) {
        await updateFuncion(
          editingId,
          form,
        )

        setSuccess(
          'Función actualizada correctamente',
        )
      } else {
        await createFuncion(form)

        setSuccess(
          'Función creada correctamente',
        )
      }

      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)

      if (
        filters.peliculaId ||
        filters.salaId ||
        filters.fecha
      ) {
        await applyFilters(filters)
      } else {
        await loadData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function handleEdit(id: string) {
    try {
      const funcion = await getFuncion(id)

      setEditingId(id)

      setForm({
        peliculaId:
          funcion.pelicula?.id ?? '',
        salaId: funcion.sala?.id ?? '',
        fechaHora: toDateInputValue(
          funcion.fechaHora,
        ),
        tipo:
          funcion.pelicula?.tipo ??
          'ESTRENO',
        activa: funcion.activa,
      })

      setShowForm(true)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleDelete(
    id: string,
  ) {
    if (
      !confirm('¿Eliminar función?')
    ) {
      return
    }

    try {
      await deleteFuncion(id)

      setSuccess(
        'Función eliminada correctamente',
      )

      if (
        filters.peliculaId ||
        filters.salaId ||
        filters.fecha
      ) {
        await applyFilters(filters)
      } else {
        await loadData()
      }
    } catch (error) {
      console.error(error)
    }
  }

  function handleChangeFilter(
    field:
      | 'peliculaId'
      | 'salaId'
      | 'fecha',
    value: string,
  ) {
    const next = {
      ...filters,
      value,
    }

    setFilters(next)
    applyFilters(next)
  }

  function handleResetFilters() {
    const empty = {
      peliculaId: '',
      salaId: '',
      fecha: '',
    }

    setFilters(empty)
    loadData()
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Gestión de Funciones
          </h1>

          <p className="text-muted-foreground">
            {funciones.length} funciones registradas
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingId(null)
            setForm(EMPTY_FORM)
            setShowForm(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Función
        </Button>

      </div>

      {success && (
        <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-4 flex gap-3 text-green-700 dark:text-green-300">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* FILTROS */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="grid md:grid-cols-3 gap-4">

          <div>
            <Label>Filtrar por Película</Label>

            <select
              className="w-full h-10 mt-2 rounded-md border bg-background px-3"
              value={filters.peliculaId}
              onChange={(e) =>
                handleChangeFilter(
                  'peliculaId',
                  e.target.value,
                )
              }
            >
              <option value="">
                Todas las películas
              </option>

              {peliculas.map((pelicula) => (
                <option
                  key={pelicula.id}
                  value={pelicula.id}
                >
                  {pelicula.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Filtrar por Sala</Label>

            <select
              className="w-full h-10 mt-2 rounded-md border bg-background px-3"
              value={filters.salaId}
              onChange={(e) =>
                handleChangeFilter(
                  'salaId',
                  e.target.value,
                )
              }
            >
              <option value="">
                Todas las salas
              </option>

              {salas.map((sala) => (
                <option
                  key={sala.id}
                  value={sala.id}
                >
                  {sala.nombre} —{' '}
                  {sala.cine?.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Filtrar por Fecha</Label>

            <Input
              type="date"
              className="mt-2"
              value={filters.fecha}
              onChange={(e) =>
                handleChangeFilter(
                  'fecha',
                  e.target.value,
                )
              }
            />
          </div>

        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleResetFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-card">

          <h2 className="font-semibold text-lg mb-4">
            {editingId
              ? 'Editar Función'
              : 'Nueva Función'}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <Label>Película</Label>

              <select
                value={form.peliculaId}
                onChange={(e) => {
                  const selected =
                    peliculas.find(
                      (p) =>
                        p.id ===
                        e.target.value,
                    )

                  setForm({
                    ...form,
                    peliculaId:
                      e.target.value,
                    tipo:
                      selected?.tipo ??
                      form.tipo,
                  })
                }}
                className="w-full h-10 mt-2 rounded-md border bg-background px-3"
              >
                <option value="">
                  Seleccione una película
                </option>

                {peliculas.map((pelicula) => (
                  <option
                    key={pelicula.id}
                    value={pelicula.id}
                  >
                    {pelicula.titulo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Sala</Label>

              <select
                value={form.salaId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    salaId: e.target.value,
                  })
                }
                className="w-full h-10 mt-2 rounded-md border bg-background px-3"
              >
                <option value="">
                  Seleccione una sala
                </option>

                {salas.map((sala) => (
                  <option
                    key={sala.id}
                    value={sala.id}
                  >
                    {sala.nombre} —{' '}
                    {sala.cine?.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Fecha y hora</Label>

              <Input
                type="datetime-local"
                value={form.fechaHora}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fechaHora:
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
                    tipo: e.target.value,
                  })
                }
                className="w-full h-10 mt-2 rounded-md border bg-background px-3"
              >
                <option value="ESTRENO">
                  ESTRENO
                </option>
                <option value="PREVENTA">
                  PREVENTA
                </option>
              </select>
            </div>

            <div>
              <Label>Precio base</Label>

              <Input
                value="Q 45.00"
                disabled
              />
            </div>

            <div className="flex gap-2 items-center pt-8">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) =>
                  setForm({
                    ...form,
                    activa:
                      e.target.checked,
                  })
                }
              />

              <Label>
                Función activa
              </Label>
            </div>

          </div>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={handleSubmit}
            >
              {editingId
                ? 'Guardar Cambios'
                : 'Crear Función'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setForm(EMPTY_FORM)
              }}
            >
              Cancelar
            </Button>
          </div>

        </div>
      )}

      {/* TABLA */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">

          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4">
                Función
              </th>
              <th className="text-left p-4">
                Sala / Cine
              </th>
              <th className="text-left p-4">
                Fecha y hora
              </th>
              <th className="text-left p-4">
                Precio
              </th>
              <th className="text-left p-4">
                Estado
              </th>
              <th className="text-right p-4">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {funciones.map((funcion) => (
              <tr
                key={funcion.id}
                className="border-b hover:bg-muted/30"
              >
                <td className="p-4">
                  <div className="space-y-2">

                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4" />
                      <span className="font-medium">
                        {funcion.pelicula
                          ?.titulo ??
                          '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Tag className="h-4 w-4" />
                      {funcion.pelicula
                        ?.tipo ?? '-'}
                    </div>

                  </div>
                </td>

                <td className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-4 w-4" />
                      <span>
                        {funcion.sala?.nombre ??
                          '-'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Building2 className="h-4 w-4" />
                      {funcion.cine?.nombre ??
                        '-'}
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        {formatDateTime(
                          funcion.fechaHora,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock3 className="h-4 w-4" />
                      {funcion.sala
                        ?.tipoSala ?? '-'}
                    </div>
                  </div>
                </td>

                <td className="p-4">
                  Q{' '}
                  {Number(
                    funcion.precioBase,
                  ).toFixed(2)}
                </td>

                <td className="p-4">
                  <Badge
                    variant={
                      funcion.activa
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {funcion.activa
                      ? 'Activa'
                      : 'Inactiva'}
                  </Badge>
                </td>

                <td className="p-4">
                  <div className="flex justify-end gap-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleEdit(
                          funcion.id,
                        )
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDelete(
                          funcion.id,
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>

        {funciones.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <CalendarDays className="mx-auto h-8 w-8 mb-2 opacity-40" />
            No hay funciones registradas
          </div>
        )}
      </div>

    </div>
  )
}