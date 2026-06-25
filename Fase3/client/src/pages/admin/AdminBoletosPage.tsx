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

import jsQR from 'jsqr'
import * as pdfjs from 'pdfjs-dist'

import { Html5Qrcode } from 'html5-qrcode'

import {
  Search,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// ✅ Importar el worker como texto (inline) para crear un Blob URL
// Esto evita el problema de MIME type con nginx en Docker
import PDFWorkerText from 'pdfjs-dist/build/pdf.worker.min.mjs?raw'

// Crear el worker una sola vez como Blob con el MIME type correcto
let workerBlobUrl: string | null = null
function getWorkerBlobUrl(): string {
  if (!workerBlobUrl) {
    const blob = new Blob([PDFWorkerText], { type: 'application/javascript' })
    workerBlobUrl = URL.createObjectURL(blob)
  }
  return workerBlobUrl
}

export function AdminBoletosPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [codigo, setCodigo] = useState('')
  const [filtros, setFiltros] = useState({
    estado: '',
    fechaInicio: '',
  })

  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [scanning, setScanning] = useState(false)

  async function cargar() {
    const data = await getBoletos(filtros)
    setBoletos(data)
  }

  useEffect(() => {
    cargar()
  }, [filtros])

  async function handleScan() {
    if (!codigo.trim()) return
    try {
      const res = await scanBoleto(codigo.trim())
      setMensaje(res.mensaje)
      setError(null)
      setCodigo('')
      cargar()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al escanear')
      setMensaje(null)
    }
  }

  async function handleBuscar() {
    if (!codigo.trim()) return
    try {
      const res = await getBoletoByCodigo(codigo.trim())
      setBoletos([res])
      setError(null)
    } catch {
      setError('No encontrado')
    }
  }

  async function handleForzar(id: string) {
    await forzarBoleto(id)
    cargar()
  }

  function leerQRDesdeImageData(imageData: ImageData): string | null {
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    return qr?.data ?? null
  }

  async function renderizarPaginaPDF(file: File): Promise<ImageData> {
    // ✅ Blob URL con MIME correcto — funciona aunque nginx devuelva octet-stream
    pdfjs.GlobalWorkerOptions.workerSrc = getWorkerBlobUrl()

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 3 })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!

    await page.render({ canvas, viewport }).promise

    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setMensaje(null)
    setError(null)

    try {
      let imageData: ImageData

      if (file.type === 'application/pdf') {
        imageData = await renderizarPaginaPDF(file)
      } else if (file.type.startsWith('image/')) {
        const bitmap = await createImageBitmap(file)
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(bitmap, 0, 0)
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } else {
        setError('Formato no soportado. Sube un PDF o una imagen.')
        return
      }

      const codigoLeido = leerQRDesdeImageData(imageData)

      if (!codigoLeido) {
        setError('No se detectó ningún código QR en el archivo.')
        return
      }

      console.log('QR leído:', codigoLeido)
      setCodigo(codigoLeido)

      const res = await scanBoleto(codigoLeido)
      setMensaje(`${res.mensaje} — ${codigoLeido}`)
      setError(null)
      cargar()
    } catch (err: any) {
      console.error(err)
      const msg = err?.response?.data?.message
      setError(msg ?? 'Error al leer o validar el QR.')
    } finally {
      setUploading(false)
    }
  }

  async function iniciarEscaner() {
  setScanning(true)

  const qr = new Html5Qrcode("reader")

  try {
    const devices = await Html5Qrcode.getCameras()
    const cameraId = devices[0].id

await qr.start(
  cameraId,
  {
    fps: 10,
    qrbox: 250,
  },
  async (decodedText) => {
    console.log("QR detectado:", decodedText)

    await qr.stop()
    setScanning(false)

    setCodigo(decodedText)

    try {
      const res = await scanBoleto(decodedText)
      setMensaje(`${res.mensaje} — ${decodedText}`)
      setError(null)
      cargar()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al escanear')
    }
  },
  (errorMessage) => {
     console.log("Scan error:", errorMessage)
  }
)
  } catch (err) {
    console.error(err)
    setError("No se pudo acceder a la cámara")
    setScanning(false)
  }
}


  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">Control de Accesos</h1>
        <p className="text-muted-foreground">Escaneo y validación de boletos</p>
      </div>

      {mensaje && (
        <div className="bg-green-100 border border-green-300 p-4 rounded flex gap-2 text-green-700">
          <CheckCircle size={18} className="shrink-0 mt-0.5" />
          <span>{mensaje}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-300 p-4 rounded flex gap-2 text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="border rounded-lg p-4 bg-card space-y-3">
        <Label>Escanear / Ingresar código</Label>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="BOL-xxxx"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            className="flex-1 min-w-[180px]"
          />
          
          <Button onClick={handleScan} title="Validar código">
            <QrCode size={16} />
          </Button>
          
          <Button variant="outline" onClick={handleBuscar} title="Buscar boleto">
            <Search size={16} />
          </Button>
          
          <Button variant="outline" asChild disabled={uploading}>
            <label className="cursor-pointer flex items-center gap-2">
              {uploading ? (
                <><Loader2 size={14} className="animate-spin" /> Leyendo...</>
              ) : (
                'Subir PDF / QR'
              )}
              <input
                hidden
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
              />
            </label>
          </Button>

              <Button onClick={iniciarEscaner}>
  📷 Escáner QR
  
</Button>
{scanning && (
  <div className="mt-4 border rounded p-3">
    <div id="reader" style={{ width: '300px' }} />
    <Button
      variant="destructive"
      className="mt-2"
      onClick={() => setScanning(false)}
    >
      Cancelar
    </Button>
  </div>
)}


        
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-card flex gap-4 flex-wrap">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          className="text-xs bg-muted/10 p-3 rounded"
        >
          <option value="">Todos</option>
          <option value="EMITIDO">Emitido</option>
          <option value="USADO">Usado</option>
        </select>
        <Input
          type="date"
          value={filtros.fechaInicio}
          onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
        />
        <Button variant="ghost" size="sm" onClick={() => setFiltros({ estado: '', fechaInicio: '' })}>
          Limpiar filtros
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {boletos.map((b) => (
          <div key={b.id} className="border rounded-lg p-4 space-y-3">
            <div className="font-semibold font-mono text-sm">{b.codigoBoleto}</div>
            <div className="text-sm text-muted-foreground">
              Usuario: {b.pago.usuarioIdRef.slice(0, 8)}...
            </div>
            <div>
              <Badge
                variant={b.estado === 'USADO' ? 'default' : 'secondary'}
                className={b.estado === 'USADO' ? 'bg-blue-500 text-white' : ''}
              >
                {b.estado}
              </Badge>
            </div>
            {b.estado !== 'USADO' && (
              <Button variant="outline" size="sm" onClick={() => handleForzar(b.id)}>
                Forzar uso
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}