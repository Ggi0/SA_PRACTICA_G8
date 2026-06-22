import { useEffect, useState } from 'react'
import {
  getBoletos,
  scanBoleto,
  getBoletoByCodigo,
  forzarBoleto,
  type Boleto,
} from '@/services/api/admin/boletos'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

import {
  Search,
  QrCode,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

export function AdminBoletosPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [codigo, setCodigo] = useState('')
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaInicio: '',
  })

  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ✅ cargar lista
  async function cargar() {
    const data = await getBoletos(filtros)
    setBoletos(data)
  }

  useEffect(() => {
    cargar()
  }, [filtros])

  // ✅ scan
  async function handleScan() {
    try {
      const res = await scanBoleto(codigo)
      setMensaje(res.mensaje)
      setError(null)
      setCodigo('')
      cargar()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error')
      setMensaje(null)
    }
  }

  // ✅ buscar manual
  async function handleBuscar() {
    try {
      const res = await getBoletoByCodigo(codigo)
      setBoletos([res])
      setError(null)
    } catch {
      setError('No encontrado')
    }
  }

  // ✅ forzar
  async function handleForzar(id: string) {
    await forzarBoleto(id)
    cargar()
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Control de Accesos</h1>
        <p className="text-muted-foreground">
          Escaneo y validación de boletos
        </p>
      </div>

      {/* ALERTAS */}
      {mensaje && (
        <div className="bg-green-100 border border-green-300 p-4 rounded flex gap-2 text-green-700">
          <CheckCircle size={18} />
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-300 p-4 rounded flex gap-2 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* SCANNER */}
      <div className="border rounded-lg p-4 bg-card space-y-3">
        <Label>Escanear / Ingresar código</Label>

        <div className="flex gap-2">
          <Input
            placeholder="BOL-xxxx"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          <Button onClick={handleScan}>
            <QrCode size={16} />
          </Button>

          <Button variant="outline" onClick={handleBuscar}>
            <Search size={16} />
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="border rounded-lg p-4 bg-card flex gap-4">
        <select
          value={filtros.estado}
          onChange={(e) =>
            setFiltros({ ...filtros, estado: e.target.value })
          }
          className="text-xs bg-muted/10 p-3 rounded overflow-auto"
        >
          <option value="">Todos</option>
          <option value="EMITIDO">Emitido</option>
          <option value="USADO">Usado</option>
        </select>

        <Input
          type="date"
          value={filtros.fechaInicio}
          onChange={(e) =>
            setFiltros({
              ...filtros,
              fechaInicio: e.target.value,
            })
          }
        />
      </div>

      {/* LISTA */}
      <div className="grid md:grid-cols-3 gap-4">

        {boletos.map((b) => (
          <div key={b.id} className="border rounded-lg p-4 space-y-3">

            <div className="font-semibold">
              {b.codigoBoleto}
            </div>

            <div className="text-sm text-muted-foreground">
              Usuario: {b.pago.usuarioIdRef.slice(0, 6)}...
            </div>

            <div>
              <Badge
                variant={
                  b.estado === 'USADO'
                    ? 'default'
                    : 'secondary'
                }
                className={
                  b.estado === 'USADO'
                    ? 'bg-blue-500 text-white'
                    : ''
                }
              >
                {b.estado}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleForzar(b.id)}
            >
              Forzar uso
            </Button>

          </div>
        ))}

      </div>

    </div>
  )
}