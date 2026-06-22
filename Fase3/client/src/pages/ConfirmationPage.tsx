import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Film, MapPin, Clock, Armchair,
  Download, Loader2, AlertCircle,
} from 'lucide-react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCheckoutStore } from '@/context/checkoutStore'
import { getMisBoletos } from '@/services/api/paymentsService'

export function ConfirmationPage() {
  const navigate = useNavigate()
  const { ticket, reset } = useCheckoutStore()
  const printRef = useRef<HTMLDivElement>(null)

  const [codigoBoleto, setCodigoBoleto] = useState<string | null>(null)
  const [fetchingBoleto, setFetchingBoleto] = useState(true)
  const [boletoError, setBoletoError] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Redirige si no hay ticket
  useEffect(() => {
    if (!ticket) navigate('/', { replace: true })
  }, [ticket, navigate])

  // Polling: el boleto se crea de forma asíncrona vía RabbitMQ,
  // así que esperamos hasta 12s (8 reintentos × 1.5s) a que aparezca
  useEffect(() => {
    if (!ticket) return

    let cancelled = false
    const MAX_RETRIES = 8
    const DELAY_MS = 1500

    const fetchBoleto = async () => {
      for (let i = 0; i < MAX_RETRIES; i++) {
        if (cancelled) return
        try {
          const boletos = await getMisBoletos()
          const boleto = boletos.find((b) => b.reservaId === ticket.reservationId)
          if (boleto) {
            if (!cancelled) {
              setCodigoBoleto(boleto.codigo)
              setFetchingBoleto(false)
            }
            return
          }
        } catch {
          // ignora y reintenta
        }
        if (i < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, DELAY_MS))
        }
      }
      if (!cancelled) {
        setBoletoError(true)
        setFetchingBoleto(false)
      }
    }

    fetchBoleto()
    return () => { cancelled = true }
  }, [ticket])

  const handleGoHome = () => {
    reset()
    navigate('/')
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current || !codigoBoleto) return
    setIsGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`boleto-${codigoBoleto}.pdf`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!ticket) {
    return <p>No hay información de reserva</p>
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-md">

        {/* Ícono de éxito — igual que antes */}
        <div className="mb-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
          <h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            ¡Pago exitoso!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu boleto ha sido emitido. ¡Disfruta la película!
          </p>
        </div>

        {/* Boleto — misma estructura que antes, se agrega sección QR en el medio */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">

          {/* Encabezado del boleto — igual que antes */}
          <div className="bg-primary px-6 py-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              <span className="font-semibold">CineMax</span>
            </div>
            <h2 className="mt-1 text-xl font-bold" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              {ticket.movieTitle}
            </h2>
          </div>

          {/* Detalles del boleto — igual que antes */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cine</p>
                <p className="text-sm font-medium">{ticket.cinemaName}</p>
                <p className="text-xs text-muted-foreground">{ticket.roomName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Función</p>
                <p className="text-sm font-medium">{ticket.showtime}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Armchair className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Asientos</p>
                <p className="text-sm font-medium">{ticket.seats.join(', ')}</p>
              </div>
            </div>

            <Separator />

            {/* NUEVO: sección QR — skeleton mientras llega el boleto del backend */}
            <div className="flex flex-col items-center py-2 gap-2">
              {fetchingBoleto ? (
                <>
                  <Skeleton className="h-[140px] w-[140px] rounded-md" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generando código de acceso...</span>
                  </div>
                </>
              ) : boletoError ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-xs text-destructive text-center">
                    No se pudo obtener el código QR.<br />
                    Consulta tu historial de boletos.
                  </p>
                </div>
              ) : (
                <>
                  <QRCodeSVG value={codigoBoleto!} size={140} level="M" includeMargin />
                  <p className="text-xs text-muted-foreground text-center">
                    Presenta este código en la entrada
                  </p>
                </>
              )}
            </div>

            <Separator />

            {/* Total — igual que antes */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total pagado</span>
              <span className="text-lg font-bold">Q{ticket.totalAmount.toFixed(2)}</span>
            </div>

            {/* Código de boleto (reemplaza al ID de reservación cuando llega) */}
            <div className="rounded-md bg-muted px-3 py-2">
              {codigoBoleto ? (
                <>
                  <p className="text-xs text-muted-foreground">Código de boleto</p>
                  <p className="text-sm font-mono font-medium">{codigoBoleto}</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">ID de reservación</p>
                  <p className="text-sm font-mono font-medium">{ticket.reservationId}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* NUEVO: botón de descarga + botón volver (el de volver estaba antes solo) */}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={!codigoBoleto || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Descargar boleto (PDF)
              </>
            )}
          </Button>

          <Button className="w-full" onClick={handleGoHome}>
            Volver a la cartelera
          </Button>
        </div>
      </div>

      {/* Div oculto fuera de pantalla para captura PDF.
          Usa colores inline explícitos porque html2canvas no entiende CSS vars. */}
      {codigoBoleto && (
        <div
          ref={printRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '380px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div style={{ backgroundColor: '#1e1b4b', padding: '20px 24px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#c7d2fe' }}>
              🎬 CineMax
            </p>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
              {ticket.movieTitle}
            </h2>
          </div>

          <div style={{ padding: '20px 24px', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Cine</p>
              <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>{ticket.cinemaName}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#4b5563' }}>{ticket.roomName}</p>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Función</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{ticket.showtime}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#6b7280' }}>Asientos</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '600', color: '#111827' }}>{ticket.seats.join(', ')}</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            {/* QRCodeCanvas para html2canvas — canvas nativo, sin problemas de SVG */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 12px' }}>
              <QRCodeCanvas value={codigoBoleto} size={160} level="M" includeMargin />
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                Presenta este código en la entrada
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Total pagado</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Q{ticket.totalAmount.toFixed(2)}</span>
            </div>

            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '8px 12px' }}>
              <p style={{ margin: 0, fontSize: '9px', color: '#6b7280' }}>Código de boleto</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600', color: '#111827' }}>
                {codigoBoleto}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}