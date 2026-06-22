import httpClient from '../httpClient'


export interface Boleto {
  id: string
  codigoBoleto: string
  estado: 'EMITIDO' | 'USADO' | 'ANULADO'
  creado: string
  reservaIdRef: string

  pago: {
    usuarioIdRef: string
    monto: string
  }
}

// ✅ LISTAR
export async function getBoletos(params?: {
  estado?: string
  fechaInicio?: string
  fechaFin?: string
}) {
  const { data } = await httpClient.get('/admin/boletos', {
    params,
  })
  return data as Boleto[]
}

// ✅ SCAN
export async function scanBoleto(codigo: string) {
  const { data } = await httpClient.post('/admin/boletos/scan', {
    codigo,
  })
  return data
}

// ✅ BUSCAR
export async function getBoletoByCodigo(codigo: string) {
  const { data } = await httpClient.get(
    `/admin/boletos/codigo/${codigo}`,
  )
  return data
}

// ✅ FORZAR
export async function forzarBoleto(id: string) {
  const { data } = await httpClient.post(
    `/admin/boletos/${id}/forzar`,
  )
  return data
}