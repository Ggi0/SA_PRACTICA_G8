# Principios SOLID — mapeo en los módulos transaccionales

> Documentar con referencias a archivos/clases reales del backend
> (`reservas-service`, `payments-service`, `users-service`).

| Principio | Dónde se aplica (ejemplo a completar con ruta del archivo) |
|-----------|------------------------------------------------------------|
| **S** — Responsabilidad única | Controller (HTTP) ≠ Service (negocio) ≠ Repository (persistencia) ≠ publisher de RabbitMQ |
| **O** — Abierto/Cerrado | Cálculo de precios por tipo de función (estreno/preventa/re-estreno) extensible sin modificar clases existentes |
| **L** — Sustitución de Liskov | Implementaciones de repositorio sustituibles por su interfaz base sin alterar el comportamiento |
| **I** — Segregación de interfaces | Interfaces pequeñas por caso de uso; los clientes no dependen de métodos que no usan |
| **D** — Inversión de dependencias | Controllers dependen de abstracciones (interfaces) de servicios; servicios dependen de interfaces de repositorios |

_(Reemplazar la columna derecha con las rutas/clases concretas y un fragmento de código por principio.)_
