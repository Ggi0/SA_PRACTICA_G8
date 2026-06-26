# Justificación de herramienta de pruebas: Jest - FilmStars

Jest se utiliza como herramienta principal de pruebas unitarias porque FilmStars está construido con Node.js, TypeScript y NestJS. Permite validar servicios, reglas de negocio, mocks de repositorios, publicadores de RabbitMQ, controladores y flujos críticos sin levantar toda la infraestructura real.

---

## ¿Por qué se utiliza Jest?

Se utiliza porque el sistema contiene operaciones críticas: autenticación, cartelera, CSV, paginación, reservas, pagos, emisión de boletos, validación de accesos y ahora métricas/observabilidad. Las pruebas automatizadas ayudan a detectar errores antes de ejecutar build, publicar imágenes o desplegar en AWS/K3s.

---

## ¿Dónde se utiliza?

Se utiliza en archivos `.spec.ts`, por ejemplo:

- `payments-service/src/payments/services/payments.service.spec.ts`
- `movies-service/src/movies/movies.service.spec.ts`
- `reservas-service/src/reservas/services/reservas.service.spec.ts`
- Pruebas esperadas para métricas: `metrics.service.spec.ts`, `ticket-access.service.spec.ts`

---

## Evidencia de uso de mocks

```ts
const makePagoRepository = () => ({
  createPago: jest.fn(),
  updateResultado: jest.fn(),
  findById: jest.fn(),
});

const makePaymentGateway = () => ({
  procesarPago: jest.fn(),
});

const makePublisher = () => ({
  publish: jest.fn().mockResolvedValue(undefined),
});
```

**Explicación:** se simulan dependencias externas para validar la lógica del servicio sin depender de PostgreSQL, RabbitMQ o gateway real.

---

## Pruebas esperadas para observabilidad

En Práctica 6 se deben validar métricas de servicios y boletos.

```ts
it('incrementa métrica cuando un boleto es validado correctamente', async () => {
  ticketRepository.findByCode.mockResolvedValue({
    id: 'boleto-1',
    estado: 'EMITIDO',
  });

  await service.scanTicket('ABC-123', 'admin-1');

  expect(ticketMetrics.recordTicketValidation).toHaveBeenCalledWith('approved');
});
```

```ts
it('registra métrica de rechazo cuando el boleto ya fue usado', async () => {
  ticketRepository.findByCode.mockResolvedValue({
    id: 'boleto-1',
    estado: 'USADO',
  });

  await expect(service.scanTicket('ABC-123', 'admin-1'))
    .rejects
    .toThrow('Boleto inválido o ya utilizado');

  expect(ticketMetrics.recordTicketValidation).toHaveBeenCalledWith('rejected');
});
```

**Explicación:** las pruebas de Práctica 6 no solo validan la lógica funcional, también verifican que las métricas se registren correctamente para Prometheus/Grafana.

---

## Integración con GitHub Actions

```yaml
- name: Run tests with coverage when available
  run: |
    if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['test:cov'] ? 0 : 1)"; then
      npm run test:cov
    else
      echo "No test:cov script in ${{ matrix.service }}; build gate already passed."
    fi
```

**Explicación:** Jest se ejecuta dentro del pipeline antes de construir imágenes y desplegar. Si las pruebas fallan, no debe continuar el despliegue.

---

## Conclusión

Jest se mantiene como herramienta de pruebas porque permite validar reglas críticas de negocio y, en Práctica 6, también la instrumentación de métricas. Esto ayuda a garantizar que el sistema sea funcional antes de desplegarse en AWS, Docker Compose o K3s.
