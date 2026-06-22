import { useEffect, useState } from 'react'

import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  MapPin,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import {
  getCities,
  getCinemas,
  getCinema,
  getCinemasByCity,
  createCinema,
  updateCinema,
  deleteCinema,
} from '@/services/api/admin/cinemasCRUD'

export function AdminBoletosPage() {
  const [cities, setCities] = useState<any[]>([])
  const [cinemas, setCinemas] = useState<any[]>([])

  const [success, setSuccess] =
    useState('')

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [showForm, setShowForm] =
    useState(false)

  const [lastCinemaId, setLastCinemaId] =
    useState('')

  const [form, setForm] = useState({
    ciudad_id: '',
    nombre: '',
    direccion: '',
    activo: true,
  })

  async function loadData() {
    const [citiesData, cinemasData] =
      await Promise.all([
        getCities(),
        getCinemas(),
      ])

    setCities(citiesData)
    setCinemas(cinemasData)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit() {
    try {
      if (editingId) {
        await updateCinema(
          editingId,
          form,
        )

        setSuccess(
          'Cine actualizado correctamente',
        )
      } else {
        await createCinema(form)

        setSuccess(
          'Cine creado exitosamente',
        )

        const updated =
          await getCinemas()

        setCinemas(updated)

        if (updated.length > 0) {
          setLastCinemaId(
            updated[0].id,
          )
        }
      }

      await loadData()

      setShowForm(false)

      setEditingId(null)

      setForm({
        ciudad_id: '',
        nombre: '',
        direccion: '',
        activo: true,
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function handleEdit(
    id: string,
  ) {
    const cinema =
      await getCinema(id)

    setEditingId(id)

    setForm({
      ciudad_id:
        cinema.ciudad_id,
      nombre: cinema.nombre,
      direccion:
        cinema.direccion,
      activo: cinema.activo,
    })

    setShowForm(true)
  }

  async function handleDelete(
    id: string,
  ) {
    if (
      !confirm(
        '¿Eliminar este cine?',
      )
    )
      return

    await deleteCinema(id)

    loadData()
  }

  async function filterByCity(
    cityId: string,
  ) {
    if (!cityId) {
      loadData()
      return
    }

    const data =
      await getCinemasByCity(
        cityId,
      )

    setCinemas(data)
  }

  return (
  <div className="space-y-6">

    <div className="flex items-center justify-between">

      <div>
        <h1 className="text-3xl font-bold">
          Gestión de BOLETOS
        </h1>

        <p className="text-muted-foreground">
          {cinemas.length} cines registrados
        </p>
      </div>

      <Button onClick={() => setShowForm(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nuevo Cine
      </Button>

    </div>

    {success && (
      <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-4 flex gap-3 text-green-700 dark:text-green-300">
        <CheckCircle size={20} />
        {success}
      </div>
    )}

    {/* ✅ FILTRO (igual que SALAS) */}
    <div className="border rounded-lg p-4 bg-card">

      <Label>Filtrar por ciudad</Label>

      <select
        className="w-full h-10 mt-2 rounded-md border bg-background px-3"
        onChange={(e) => filterByCity(e.target.value)}
      >
        <option value="">Todas las ciudades</option>

        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.nombre}
          </option>
        ))}
      </select>

    </div>

    {showForm && (
      <div className="grid lg:grid-cols-3 gap-6">

        {/* FORM */}
        <div className="lg:col-span-2 border rounded-lg p-6 bg-card">

          <h2 className="font-semibold text-lg mb-4">
            {editingId ? 'Editar Cine' : 'Nuevo Cine'}
          </h2>

          <div className="space-y-4">

            <div>
              <Label>Ciudad</Label>

              <select
                className="w-full h-10 mt-2 rounded-md border bg-background px-3"
                value={form.ciudad_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    ciudad_id: e.target.value,
                  })
                }
              >
                <option value="">Seleccionar ciudad</option>

                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombre: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label>Dirección</Label>
              <Input
                value={form.direccion}
                onChange={(e) =>
                  setForm({
                    ...form,
                    direccion: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) =>
                  setForm({
                    ...form,
                    activo: e.target.checked,
                  })
                }
              />
              <Label>Activo</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingId ? 'Guardar Cambios' : 'Crear Cine'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            </div>

          </div>

        </div>

        {/* SIDEBAR */}
        <div className="border rounded-lg p-6 bg-card">

          <h3 className="font-semibold mb-3">
            Último cine creado
          </h3>

          {lastCinemaId ? (
            <>
              <code className="block p-3 rounded bg-muted text-xs break-all">
                {lastCinemaId}
              </code>

              <Button
                className="w-full mt-4"
                onClick={() => handleEdit(lastCinemaId)}
              >
                Obtener Cine
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no se ha creado ningún cine.
            </p>
          )}

        </div>

      </div>
    )}

    {/* ✅ TABLA igual a SALAS */}
    <div className="border rounded-lg overflow-hidden">

      <table className="w-full">

        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4">Cine</th>
            <th className="text-left p-4">Ciudad</th>
            <th className="text-left p-4">Dirección</th>
            <th className="text-left p-4">Estado</th>
            <th className="text-right p-4">Acciones</th>
          </tr>
        </thead>

        <tbody>

          {cinemas.map((cinema) => (
            <tr
              key={cinema.id}
              className="border-b hover:bg-muted/30"
            >

              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">
                    {cinema.nombre}
                  </span>
                </div>
              </td>

              <td className="p-4">
                {cinema.ciudad_nombre}
              </td>

              <td className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {cinema.direccion}
                </div>
              </td>

              <td className="p-4">
                <Badge
                  variant={
                    cinema.activo ? 'default' : 'secondary'
                  }
                >
                  {cinema.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>

              <td className="p-4">
                <div className="flex justify-end gap-2">

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(cinema.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(cinema.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                </div>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

      {cinemas.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">

          <Building2 className="mx-auto h-8 w-8 mb-2 opacity-40" />

          No hay cines registrados

        </div>
      )}

    </div>

  </div>
)
}