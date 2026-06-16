import { useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Info,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  uploadMoviesCsv,
  BulkUploadResponse,
} from '@/services/api/admin/moviesCRUD'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function AdminBulkMoviesPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<BulkUploadResponse | null>(null)

  const handleOpenFilePicker = () => {
    inputRef.current?.click()
  }

  const resetMessages = () => {
    setSuccessMessage('')
    setErrorMessage('')
    setResult(null)
  }

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null

    resetMessages()

    if (!file) {
      setSelectedFile(null)
      return
    }

    const isCsv =
      file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel'

    if (!isCsv) {
      setSelectedFile(null)
      setErrorMessage('Solo se permiten archivos con formato .csv')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null)
      setErrorMessage(
        'El archivo supera el tamaño máximo permitido de 10 MB',
      )
      event.target.value = ''
      return
    }

    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    resetMessages()

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Debes seleccionar un archivo CSV')
      return
    }

    resetMessages()
    setUploading(true)

    try {
      const response = await uploadMoviesCsv(selectedFile)

      setResult(response)
      setSuccessMessage(response.message)
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ||
          'Ocurrió un error al cargar el archivo'

        setErrorMessage(backendMessage)
      } else {
        setErrorMessage('Ocurrió un error inesperado al cargar el archivo')
      }
    } finally {
      setUploading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Carga Masiva de Películas
          </h1>

          <p className="text-muted-foreground">
            Sube un archivo CSV para registrar múltiples películas en una sola operación.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/admin/movies')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a películas
        </Button>
      </div>

      {/* ALERTS */}
      {successMessage && (
        <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-4 flex gap-3 text-green-700 dark:text-green-300">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-lg p-4 flex gap-3 text-red-700 dark:text-red-300">
          <XCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* PANEL DE CARGA */}
        <div className="lg:col-span-2 border rounded-lg p-6 bg-card">
          <h2 className="font-semibold text-lg mb-4">
            Subir archivo CSV
          </h2>

          <div className="space-y-4">
            <div className="border rounded-lg p-5 bg-muted/20">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3 items-center">
                  <div className="rounded-lg p-3 bg-primary/10 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="font-medium">
                      Selecciona un archivo CSV
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tamaño máximo permitido: 10 MB
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleOpenFilePicker}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Escoger archivo
                </Button>
              </div>

              {selectedFile && (
                <div className="mt-4 rounded-lg border p-4 bg-background">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleRemoveFile}
                      >
                        Quitar archivo
                      </Button>

                      <Button
                        onClick={handleUpload}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Cargando...' : 'Cargar archivo'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RESULTADO */}
            {result && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Resultado de la carga
                </h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-background">
                    <p className="text-sm text-muted-foreground">
                      Total de filas
                    </p>
                    <p className="text-2xl font-bold mt-1">
                      {result.summary.totalFilas}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Procesadas correctamente
                    </p>
                    <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">
                      {result.summary.procesadasCorrectamente}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Rechazadas
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-300">
                      {result.summary.rechazadas}
                    </p>
                  </div>
                </div>

                {result.errors.length > 0 ? (
                  <div className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <h4 className="font-semibold">
                        Filas con error
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {result.errors.map((rowError) => (
                        <div
                          key={`${rowError.rowNumber}-${rowError.raw.titulo ?? 'row'}`}
                          className="border rounded-lg p-4 bg-background"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="destructive">
                              Fila {rowError.rowNumber}
                            </Badge>

                            {rowError.raw.titulo && (
                              <Badge variant="outline">
                                {rowError.raw.titulo}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            {rowError.errors.map((item, index) => (
                              <div
                                key={`${item.field}-${index}`}
                                className="text-sm"
                              >
                                <span className="font-medium">
                                  {item.field}:
                                </span>{' '}
                                <span className="text-muted-foreground">
                                  {item.message}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                              Datos recibidos:
                            </p>
                            <pre className="text-xs bg-muted/10 p-3 rounded overflow-auto">
{JSON.stringify(rowError.raw, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 rounded-lg p-4 flex gap-3 text-green-700 dark:text-green-300">
                    <CheckCircle size={20} />
                    No se encontraron errores en la carga.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL DE INSTRUCCIONES */}
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">
              Instrucciones del archivo CSV
            </h3>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>Reglas del formato</strong></p>

            <ul className="list-disc pl-5 space-y-2">
              <li>Separador principal: <code>,</code></li>
              <li>Encoding recomendado: <code>UTF-8</code></li>
              <li>La primera fila debe ser la cabecera</li>
              <li>
                La columna <code>generos</code> debe venir como lista separada por <code>|</code>
              </li>
              <li>
                <code>tipo</code> solo puede ser:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>ESTRENO</li>
                  <li>PREVENTA</li>
                  <li>REESTRENO</li>
                </ul>
              </li>
              <li>
                <code>activa</code> acepta:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>true, false</li>
                  <li>1, 0</li>
                  <li>si, sí, no</li>
                </ul>
              </li>
              <li>
                <code>fecha_estreno</code> debe ir en formato <code>YYYY-MM-DD</code>
              </li>
              <li>
                Si un texto tiene comas, debe ir entre comillas dobles <code>" "</code>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Cabecera obligatoria
            </p>

            <pre className="text-xs bg-muted/10 p-3 rounded overflow-auto">
{`titulo,sinopsis,duracion_min,clasificacion,poster_url,fecha_estreno,tipo,activa,generos`}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Ejemplo rápido
            </p>

            <pre className="text-xs bg-muted/10 p-3 rounded overflow-auto">
{`Superman 3,"Nueva película editadooo",180,PG-13,https://example.com/posters/superman.jpg,2026-12-15,ESTRENO,true,Acción|Aventura`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}