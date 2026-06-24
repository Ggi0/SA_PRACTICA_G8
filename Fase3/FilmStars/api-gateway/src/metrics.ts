import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

// Registro propio + métricas por defecto del proceso (CPU, memoria, event loop)
export const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Métrica técnica: tráfico HTTP que pasa por el gateway
export const httpRequests = new client.Counter({
  name: 'filmstars_http_requests_total',
  help: 'Total de requests HTTP procesadas por el API Gateway',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Métrica de NEGOCIO: boletos validados correctamente (escáner QR o validación forzada del admin)
export const ticketsValidated = new client.Counter({
  name: 'filmstars_tickets_validated_total',
  help: 'Total de boletos validados correctamente (escaner/forzado)',
  registers: [register],
});

// Rutas de validación de boletos (Práctica 6: escaneo y control de accesos).
// Endpoints reales del payments-service (admin): POST boletos/scan (escáner QR)
// y POST boletos/:id/forzar (validación manual forzada del admin).
const VALIDATION_RE = /\/(scan|forzar|validar|validate|escanear|check-?in)/i;

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    const route = req.baseUrl || req.path || 'unknown';
    httpRequests.inc({ method: req.method, route, status: String(res.statusCode) });
    if (res.statusCode >= 200 && res.statusCode < 300 && VALIDATION_RE.test(req.originalUrl)) {
      ticketsValidated.inc();
    }
  });
  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
