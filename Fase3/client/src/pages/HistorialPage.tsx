import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, ShoppingBag } from 'lucide-react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getMisBoletos, type Boleto } from '@/services/api/paymentsService'

const ESTADO_CONFIG = {
  EMITIDO:   { label: 'Emitido',   variant: 'default'     as const },
  USADO:     { label: 'Usado',     variant: 'secondary'   as const },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' as const },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-GT', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function HistorialPage() {
  const navigate  = useNavigate()
  const { isAuthenticated } = useAuth()
  const printRef  = useRef<HTMLDivElement>(null)

  const [boletos,       setBoletos]       = useState<Boleto[]>([])
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Protección de ruta — redirige si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true })
  }, [isAuthenticated, navigate])

  // Carga inicial de boletos
  useEffect(() => {
    if (!isAuthenticated) return
    getMisBoletos()
      .then(data => setBoletos(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  // Genera el PDF después de que React renderiza el div oculto
  // con el contenido del boleto seleccionado
  useEffect(() => {
    if (!downloadingId || !printRef.current) return
    const boleto = boletos.find(b => b.id === downloadingId)
    if (!boleto) return

    const generate = async () => {
      // Espera que QRCodeCanvas pinte su canvas antes de capturar
      await new Promise(r => setTimeout(r, 150))

      const html2canvas = (await import('html2canvas')).default
      const { jsPDF }   = await import('jspdf')

      const canvas = await html2canvas(printRef.current!, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      })

      const imgData   = canvas.toDataURL('image/png')
      const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pdfWidth  = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`boleto-${boleto.codigo}.pdf`)
      setDownloadingId(null)
    }

    generate()
  }, [downloadingId, boletos])

  const activeBoleto = downloadingId
    ? boletos.find(b => b.id === downloadingId) ?? null
    : null

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Skeleton className="mb-6 h-8 w-52" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          Historial de compras
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {boletos.length}{' '}
          {boletos.length === 1 ? 'boleto encontrado' : 'boletos encontrados'}
        </p>
      </div>

      {fetchError && (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            No se pudo cargar el historial. Intenta de nuevo más tarde.
          </p>
        </div>
      )}

      {!fetchError && boletos.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <ShoppingBag className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Sin compras aún</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cuando completes una compra, tus boletos aparecerán aquí.
          </p>
          <Button className="mt-6" onClick={() => navigate('/')}>
            Ver cartelera
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {boletos.map(boleto => {
          const cfg         = ESTADO_CONFIG[boleto.estado as keyof typeof ESTADO_CONFIG]
          const isThisOne   = downloadingId === boleto.id

          return (
            <div
              key={boleto.id}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row">

                {/* Info del boleto */}
                <div className="flex-1 p-5 space-y-3">
                  <Badge variant={cfg?.variant}>{cfg?.label ?? boleto.estado}</Badge>

                  <div>
                    <p className="text-xs text-muted-foreground">Código de boleto</p>
                    <p className="font-mono text-base font-semibold">{boleto.codigo}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Emitido</p>
                    <p className="text-sm">{formatDate(boleto.creado)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">ID de reserva</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">
                      {boleto.reservaId}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!downloadingId}
                    onClick={() => setDownloadingId(boleto.id)}
                  >
                    {isThisOne ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-3 w-3" />
                        Descargar PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* QR inline */}
                <div className="flex items-center justify-center border-t sm:border-t-0 sm:border-l border-border p-5">
                  <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG value={boleto.codigo} size={100} level="M" includeMargin />
                    <p className="text-xs text-muted-foreground">Código de acceso</p>
                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Div oculto para PDF — solo se renderiza cuando hay un boleto seleccionado.
          Colores inline explícitos porque html2canvas no entiende CSS vars. */}
      {activeBoleto && (
        <div
          ref={printRef}
          style={{
            position: 'absolute', left: '-9999px', top: 0,
            width: '380px', backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            overflow: 'hidden', fontFamily: 'Arial, sans-serif',
          }}
        >
          <div style={{ backgroundColor: '#1e1b4b', padding: '20px 24px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>
              🎬 CineMax
            </p>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
              Boleto de entrada
            </h2>
          </div>

          <div style={{ padding: '20px 24px', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Código</p>
              <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: '700', fontFamily: 'monospace', color: '#111827' }}>
                {activeBoleto.codigo}
              </p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Estado</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600',
                color: activeBoleto.estado === 'EMITIDO' ? '#16a34a'
                     : activeBoleto.estado === 'CANCELADO' ? '#dc2626' : '#6b7280' }}>
                {ESTADO_CONFIG[activeBoleto.estado as keyof typeof ESTADO_CONFIG]?.label ?? activeBoleto.estado}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Fecha de emisión</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#111827' }}>
                {formatDate(activeBoleto.creado)}
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 12px' }}>
              <QRCodeCanvas value={activeBoleto.codigo} size={160} level="M" includeMargin />
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                Presenta este código en la entrada
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '8px 12px' }}>
              <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>ID de reserva</p>
              <p style={{ margin: '2px 0 0', fontSize: '10px', fontFamily: 'monospace', color: '#4b5563' }}>
                {activeBoleto.reservaId}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}