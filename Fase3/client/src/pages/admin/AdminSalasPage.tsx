import { useEffect, useState } from 'react'

import {
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Building2,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import {
  getCinesList,
  getSalas,
  getSala,
  getSalasByCinema,
  createSala,
  updateSala,
  deleteSala,
} from '@/services/api/admin/salasCRUD'

const EMPTY_FORM = {
  cineId: '',
  nombre: '',
  capacidad: 20,
  tipoSala: 'NORMAL',
  activa: true,
}

export function AdminSalasPage() {
  const [salas, setSalas] = useState<any[]>([])
  const [cines, setCines] = useState<any[]>([])
  const [selectedCinema, setSelectedCinema] = useState('')

  const [showForm, setShowForm] =
    useState(false)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState('')

  const [form, setForm] =
    useState(EMPTY_FORM)

  async function loadData() {
    const [salasData, cinesData] =
      await Promise.all([
        getSalas(),
        getCinesList(),
      ])

    setSalas(salasData)
    setCines(cinesData)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit() {
    try {
      const payload = {
        ...form,
        capacidad: Number(
          form.capacidad,
        ),
      }

      if (editingId) {
        await updateSala(
          editingId,
          payload,
        )

        setSuccess(
          'Sala actualizada correctamente',
        )
      } else {
        await createSala(payload)

        setSuccess(
          'Sala creada correctamente',
        )
      }

      setShowForm(false)

      setEditingId(null)

      setForm(EMPTY_FORM)

      loadData()
    } catch (error) {
      console.error(error)
    }
  }

  async function handleEdit(
    id: string,
  ) {
    const sala = await getSala(id)

    setEditingId(id)

    setForm({
  cineId: sala.cine?.id ?? '',
  nombre: sala.nombre,
  capacidad: sala.capacidad,
  tipoSala: sala.tipoSala,
  activa: sala.activa,
})

    setShowForm(true)
  }

  async function handleDelete(
    id: string,
  ) {
    if (
      !confirm(
        '¿Eliminar sala?',
      )
    )
      return

    await deleteSala(id)

    loadData()
  }

  async function handleFilterCinema(
    cinemaId: string,
  ) {
    if (!cinemaId) {
      loadData()
      return
    }

    const data =
      await getSalasByCinema(
        cinemaId,
      )

    setSalas(data)
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Gestión de Salas
          </h1>

          <p className="text-muted-foreground">
            {salas.length} salas registradas
          </p>
        </div>

        <Button
          onClick={() =>
            setShowForm(true)
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sala
        </Button>

      </div>

      {success && (
        <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-4 flex gap-3 text-green-700 dark:text-green-300">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      <div className="border rounded-lg p-4 bg-card">

        <Label>
          Filtrar por Cine
        </Label>

        <select
  value={selectedCinema}
  className="w-full h-10 mt-2 rounded-md border bg-background px-3"
  onChange={(e) => {
    const value = e.target.value

    setSelectedCinema(value)
    handleFilterCinema(value)
  }}
>
  <option value="">
    Todos los cines
  </option>

  {cines.map((cine) => (
    <option key={cine.id} value={cine.id}>
      {cine.nombre}
    </option>
  ))}
</select>

      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-card">

          <h2 className="font-semibold text-lg mb-4">
            {editingId
              ? 'Editar Sala'
              : 'Nueva Sala'}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <div>
              <Label>Cine</Label>

              <select
                value={
                  form.cineId
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    cineId:
                      e.target
                        .value,
                  })
                }
                className="w-full h-10 rounded-md border bg-background px-3"
              >
                <option value="">
                  Seleccione un cine
                </option>

                {cines.map(
                  (cine) => (
                    <option
                      key={
                        cine.id
                      }
                      value={
                        cine.id
                      }
                    >
                      {
                        cine.nombre
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <Label>
                Nombre
              </Label>

              <Input
                value={
                  form.nombre
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    nombre:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            <div>
              <Label>
                Capacidad
              </Label>

              <Input
                type="number"
                value={
                  form.capacidad
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacidad:
                      Number(
                        e.target
                          .value,
                      ),
                  })
                }
              />
            </div>

            <div>
              <Label>
                Tipo de Sala
              </Label>

              <select
                value={
                  form.tipoSala
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoSala:
                      e.target
                        .value,
                  })
                }
                className="w-full h-10 rounded-md border bg-background px-3"
              >
                <option value="NORMAL">
                  NORMAL
                </option>

                <option value="VIP">
                  VIP
                </option>

                <option value="IMAX">
                  IMAX
                </option>

                <option value="4DX">
                  4DX
                </option>
              </select>
            </div>

            <div className="flex gap-2 items-center">

              <input
                type="checkbox"
                checked={
                  form.activa
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    activa:
                      e.target
                        .checked,
                  })
                }
              />

              <Label>
                Sala Activa
              </Label>

            </div>

          </div>

          <div className="flex gap-2 mt-6">

            <Button
              onClick={
                handleSubmit
              }
            >
              {editingId
                ? 'Guardar Cambios'
                : 'Crear Sala'}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setShowForm(
                  false,
                )
              }
            >
              Cancelar
            </Button>

          </div>

        </div>
      )}

      <div className="border rounded-lg overflow-hidden">

        <table className="w-full">

          <thead>

            <tr className="border-b bg-muted/50">

              <th className="text-left p-4">
                Sala
              </th>

              <th className="text-left p-4">
                Cine
              </th>

              <th className="text-left p-4">
                Capacidad
              </th>

              <th className="text-left p-4">
                Tipo
              </th>

              <th className="text-right p-4">
                Acciones
              </th>

            </tr>

          </thead>

          <tbody>

            {salas.map((sala) => (
              <tr
                key={sala.id}
                className="border-b hover:bg-muted/30"
              >
                <td className="p-4">

                  <div className="flex items-center gap-2">

                    <DoorOpen className="h-4 w-4" />

                    <span className="font-medium">
                      {
                        sala.nombre
                      }
                    </span>

                  </div>

                </td>

                <td className="p-4">

                  <div className="flex items-center gap-2 text-muted-foreground">

                    <Building2 className="h-4 w-4" />

                    {sala.cine
                      ?.nombre ??
                      '-'}

                  </div>

                </td>

                <td className="p-4">

                  <div className="flex items-center gap-2">

                    <Users className="h-4 w-4" />

                    {
                      sala.capacidad
                    }

                  </div>

                </td>

                <td className="p-4">

                  <Badge
                    variant="outline"
                  >
                    {
                      sala.tipoSala
                    }
                  </Badge>

                </td>

                <td className="p-4">

                  <div className="flex justify-end gap-2">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleEdit(
                          sala.id,
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
                          sala.id,
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

        {salas.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">

            <DoorOpen className="mx-auto h-8 w-8 mb-2 opacity-40" />

            No hay salas registradas

          </div>
        )}

      </div>

    </div>
  )
}