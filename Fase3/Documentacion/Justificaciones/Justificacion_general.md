# Justificación general del proyecto FilmStars

FilmStars es una plataforma web para la venta de boletos de cine en línea. El objetivo principal del proyecto es permitir que los usuarios consulten la cartelera, seleccionen ciudad y cine, visualicen funciones disponibles, seleccionen asientos, realicen una reserva, procesen un pago simulado y obtengan un boleto final.

El proyecto ha evolucionado por fases. Inicialmente se definió la arquitectura base del sistema bajo un enfoque orientado a servicios. Luego se incorporó una implementación funcional con autenticación mediante JWT, frontend integrado, backend modular, comunicación asíncrona mediante RabbitMQ, persistencia separada por dominio y ejecución local mediante Docker Compose. Posteriormente se agregó el módulo administrativo, controles de acceso por rol, pruebas unitarias y pipeline CI/CD. En la Fase 4 se amplía la solución para responder a nuevas necesidades de eficiencia de datos e infraestructura inmutable.

---

## Contexto general del sistema

La plataforma FilmStars busca resolver el proceso completo de compra de boletos de cine desde una aplicación web. Para ello, el sistema debe permitir que el usuario final pueda consultar películas disponibles, seleccionar una función, escoger asientos, realizar una reserva, simular el pago y recibir un boleto digital.

A nivel administrativo, el sistema también debe permitir que usuarios con rol `Admin` gestionen la información necesaria para operar la cartelera, como películas, cines, salas, horarios, funciones y mapa base de asientos. Esta separación entre usuario final y administrador permite controlar de mejor manera las responsabilidades del sistema.

El problema principal del dominio es que la venta de boletos requiere manejar concurrencia. Varios usuarios pueden intentar seleccionar los mismos asientos al mismo tiempo, por lo que el sistema debe evitar condiciones de carrera, bloquear temporalmente asientos y asegurar que no se venda el mismo asiento más de una vez para una misma función.

---

## Implementación de la solución

La solución se construyó separando el sistema en componentes independientes. Cada componente cumple una responsabilidad específica dentro del flujo general de FilmStars.

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite + TypeScript | Interfaz web para usuarios y administradores. Permite login, registro, consulta de cartelera, catálogo paginado, flujo de compra y panel administrativo. |
| API Gateway | NestJS + TypeScript | Punto de entrada único para el frontend. Enruta peticiones hacia servicios internos y valida JWT en rutas protegidas. |
| Users Service | NestJS + TypeScript + PostgreSQL | Registro de usuarios, inicio de sesión, emisión de JWT, gestión de roles y administración de usuarios. |
| Movies Service | NestJS + TypeScript + PostgreSQL | Consulta de ciudades, cines, cartelera, películas, funciones, gestión administrativa de cartelera, carga CSV y paginación del catálogo. |
| Reservations Service | NestJS + TypeScript + PostgreSQL | Gestión de reservas, validación de disponibilidad, bloqueo temporal de asientos y expiración de reservas. |
| Payments Service | NestJS + TypeScript + PostgreSQL | Procesamiento de pagos simulados, registro de transacciones, emisión de boletos, detalles de pago y reembolsos. |
| RabbitMQ | RabbitMQ Management | Broker de mensajería utilizado para desacoplar procesos críticos como reservas y pagos. |
| Docker Compose | Docker | Orquestación local y productiva de contenedores, servicios, bases de datos y RabbitMQ. |
| GitHub Actions | CI/CD | Automatización de pruebas, validación de cobertura, construcción de imágenes, publicación en Docker Hub y despliegue. |
| Docker Hub | Registry público | Registro de imágenes Docker precompiladas para frontend y servicios backend. |
| AWS EC2 / VM | AWS | Entorno de nube utilizado para despliegue de la aplicación. |
| Jest | Testing | Ejecución de pruebas unitarias y generación de cobertura en servicios backend. |
| CSV | Formato de intercambio de datos | Permite cargar de forma masiva múltiples películas desde el panel administrativo. |

---

## Aplicación de arquitectura

Se utilizó una Arquitectura Orientada a Servicios porque FilmStars contiene dominios de negocio claramente separados: usuarios, películas/cartelera, reservas/asientos y pagos. Cada dominio tiene reglas propias, datos propios y responsabilidades distintas.

La separación en servicios permite reducir el acoplamiento y facilita que cada parte del sistema pueda evolucionar de forma independiente. Por ejemplo, el servicio de usuarios puede cambiar su lógica de autenticación sin afectar directamente la lógica de cartelera; de igual forma, el servicio de pagos puede evolucionar sin modificar la consulta de películas.

También se definió un API Gateway como punto de entrada único para centralizar el acceso desde el frontend. Esto permite enrutar las peticiones hacia los servicios internos y aplicar validaciones de seguridad como JWT y control de roles.

En los procesos críticos, como la reserva de asientos y el procesamiento de pagos, se contempla comunicación asíncrona mediante RabbitMQ. Esta decisión ayuda a evitar bloqueos en el flujo principal, permite procesar tareas mediante consumidores independientes y reduce el riesgo de pérdida de operaciones importantes ante fallos temporales.

---

## Decisiones técnicas principales

| Decisión | Justificación |
|---|---|
| Arquitectura Orientada a Servicios | Permite dividir el sistema por dominios, reducir acoplamiento y facilitar mantenimiento. |
| API Gateway | Centraliza el acceso desde el frontend y protege rutas mediante JWT. |
| Servicios separados | Permiten que usuarios, cartelera, reservas y pagos evolucionen de forma independiente. |
| PostgreSQL por servicio | Mantiene independencia de datos por dominio y permite aplicar restricciones, transacciones e índices. |
| RabbitMQ | Desacopla procesos críticos y permite procesar reservas o pagos de manera asíncrona. |
| Docker Compose | Facilita levantar el entorno completo con servicios, bases de datos y RabbitMQ. |
| TypeScript | Mejora mantenibilidad mediante tipado estático y reduce errores al trabajar con DTOs e interfaces. |
| NestJS | Organiza el backend mediante módulos, controladores, servicios, repositorios e inyección de dependencias. |
| React + Vite | Permite construir una interfaz rápida, modular y fácil de integrar con APIs. |
| JWT | Permite manejar autenticación basada en claims como id, nombre, correo y rol. |
| GitHub Actions | Automatiza pruebas, construcción, publicación de imágenes y despliegue. |
| Docker Hub | Permite almacenar imágenes Docker precompiladas y usarlas en despliegues inmutables. |
| AWS EC2 / VM | Proporciona un entorno de nube para desplegar la aplicación. |
| Jest | Permite validar unidades de código y generar evidencia de cobertura. |
| CSV | Facilita la carga masiva de datos tabulares de películas. |

---

## Flujo general del sistema

1. El usuario accede al frontend de FilmStars.
2. El frontend consume el API Gateway como punto de entrada principal.
3. El usuario puede registrarse o iniciar sesión.
4. El Users Service valida credenciales y genera un JWT con los claims del usuario.
5. El frontend almacena temporalmente el token y lo envía en la cabecera `Authorization: Bearer <token>` para acceder a rutas protegidas.
6. El usuario consulta ciudades, cines, películas y funciones.
7. El catálogo de películas se consulta de forma paginada desde el backend.
8. El usuario selecciona una película, consulta funciones y selecciona asientos.
9. El sistema valida disponibilidad y bloquea temporalmente los asientos seleccionados.
10. La reserva se procesa mediante el servicio de reservas y, cuando corresponde, por cola de mensajería.
11. El usuario realiza un pago simulado.
12. El servicio de pagos registra la transacción y confirma el resultado.
13. Si el pago es exitoso, el sistema confirma la compra y emite el boleto final.
14. Si el pago falla o expira el bloqueo, los asientos deben liberarse.
15. El administrador puede iniciar sesión y acceder al panel administrativo si posee rol `Admin`.
16. El administrador puede gestionar cartelera, cines, salas, funciones y cargar películas manualmente o mediante CSV.

---

## Estado de funcionalidades

| Área | Estado |
|---|---|
| Autenticación y JWT | Implementado en Users Service y API Gateway. |
| Gestión de usuarios | Implementado parcialmente y ampliado con control de roles. |
| Consulta de cartelera | Implementada en Movies Service. |
| Base de datos SOA | Implementada con bases PostgreSQL separadas por dominio. |
| RabbitMQ | Configurado para comunicación asíncrona entre procesos críticos. |
| Reservas y pagos | Diseñados e integrados como servicios del flujo de compra. |
| Docker Compose | Utilizado para levantar frontend, backend, bases de datos y RabbitMQ. |
| Módulo administrativo | Incorporado para usuarios con rol `Admin`. |
| Control de acceso End-to-End | Aplicado en frontend y backend mediante validación de JWT y rol. |
| Pruebas unitarias | Incorporadas para validar lógica crítica del backend. |
| Pipeline CI/CD | Incorporado para pruebas, build, push de imágenes y despliegue. |
| Carga CSV | Agregada en Fase 4 como alternativa de carga masiva de películas. |
| Paginación server-side | Agregada en Fase 4 para optimizar la consulta del catálogo. |
| Docker Hub | Agregado en Fase 4 como registry de imágenes precompiladas. |
| Deploy inmutable | Agregado en Fase 4 mediante pull de imágenes desde Docker Hub. |

---

## Justificación de funcionalidades administrativas

El módulo administrativo se incorporó porque la plataforma necesita una forma controlada de gestionar la operación interna del cine. No todos los usuarios deben tener acceso a funciones de administración, por lo que se definió un rol `Admin` validado mediante JWT.

El administrador puede gestionar información como cines, salas, mapas de asientos, películas, horarios y funciones. Esta decisión permite separar el flujo del cliente final del flujo operativo del sistema.

Además, se aplica validación de acceso de extremo a extremo. Esto significa que el frontend puede ocultar opciones administrativas, pero el backend también debe validar el JWT y el rol antes de procesar cualquier petición administrativa. Esto evita que un usuario común pueda consumir directamente endpoints protegidos.

---

## Justificación de carga masiva mediante CSV

En la Fase 4 se agregó carga masiva de películas mediante archivo CSV. Esta funcionalidad responde a la necesidad de administrar catálogos grandes sin registrar cada película una por una.

En un escenario real, las distribuidoras pueden entregar catálogos con muchas películas y datos asociados, como título, sinopsis, duración, clasificación, fecha de estreno, tipo de función y géneros. Procesar esta información manualmente aumenta el tiempo operativo y la probabilidad de errores humanos.

La carga CSV permite:

- Reducir el tiempo de registro de películas.
- Procesar catálogos grandes de forma masiva.
- Mantener la carga manual como alternativa.
- Validar estructura y campos antes de insertar.
- Reportar filas exitosas y rechazadas.
- Evitar duplicidad según las reglas definidas por el equipo.

Formato CSV propuesto:

```csv
titulo,sinopsis,duracion_min,clasificacion,poster_url,fecha_estreno,tipo,generos
Guardianes del Cine,Una aventura espacial,120,PG-13,https://example.com/poster.jpg,2026-06-15,ESTRENO,Acción|Aventura
```

El campo `tipo` debe admitir valores como `ESTRENO`, `PREVENTA` o `REESTRENO`. Los géneros pueden separarse mediante `|` para permitir múltiples géneros en una misma fila.

La carga CSV se ubica dentro del Movies Service porque pertenece al dominio de películas y cartelera. El administrador realiza la carga desde el panel administrativo, el API Gateway valida el acceso y el servicio de películas procesa el archivo, valida las filas e inserta los registros válidos.

---

## Justificación de paginación del lado del servidor

También en Fase 4 se agregó paginación del lado del servidor para la vista general de cartelera. Esta decisión se tomó porque, a medida que el catálogo crece, no es eficiente enviar todas las películas al frontend.

Si el backend enviara todo el catálogo y el frontend hiciera la paginación localmente, se incrementaría el tráfico de red, el tiempo de carga y el costo de renderizado en el navegador. Por eso se definió que el backend debe devolver como máximo 10 películas por página.

Ejemplo de endpoint esperado:

```http
GET /api/movies?page=1&limit=10&category=ESTRENO&city=guatemala&search=guardianes
```

Ejemplo de respuesta esperada:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 36,
    "totalPages": 4
  }
}
```

La paginación debe conservar filtros por ciudad, categoría y búsqueda. Por eso los filtros se envían junto con los parámetros `page` y `limit`. De esta manera, el backend aplica los filtros antes de paginar y devuelve únicamente los registros correspondientes a la página solicitada.

Esta solución mejora:

- El rendimiento de consultas.
- El tiempo de respuesta percibido por el usuario.
- El consumo de red.
- La escalabilidad del catálogo.
- La experiencia de usuario con catálogos grandes.

---

## Justificación del pipeline CI/CD

El proyecto incorpora un pipeline CI/CD para automatizar el proceso de calidad y despliegue. La finalidad es reducir errores manuales y asegurar que los cambios pasen por validaciones antes de llegar a un entorno desplegado.

El pipeline contempla tres fases principales:

1. **Test:** ejecuta pruebas unitarias del backend y valida que la cobertura no sea menor al 75%.
2. **Build & Push:** construye imágenes Docker de frontend y servicios backend, y las publica en Docker Hub con el tag definido.
3. **Deploy:** se conecta a la VM y ejecuta el despliegue mediante Docker Compose, descargando imágenes precompiladas.

Este flujo permite que el equipo tenga evidencia de calidad antes del despliegue y evita subir versiones que no cumplen con las pruebas mínimas.

---

## Justificación del despliegue inmutable con Docker Hub

La Fase 4 exige que la VM no compile código ni construya imágenes en producción. Por eso se adopta un flujo de despliegue inmutable basado en Docker Hub.

En este enfoque, el pipeline construye las imágenes Docker, las prueba, las etiqueta y las sube a Docker Hub. Luego, la VM únicamente descarga esas imágenes y reinicia los contenedores. Esto evita que producción dependa del código fuente o de procesos de build locales.

Comandos esperados en producción:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

Esta decisión aporta:

- Mayor consistencia entre ambientes.
- Menor carga de procesamiento en la VM.
- Menor riesgo de errores por builds locales.
- Versionamiento más claro de artefactos.
- Despliegues más rápidos y reproducibles.

---

## Justificación de tecnologías utilizadas

### TypeScript

Se eligió TypeScript porque permite trabajar con tipado estático, interfaces, DTOs y validaciones de estructura. Esto reduce errores en tiempo de desarrollo y mejora la mantenibilidad del sistema.

###  NestJS

NestJS facilita la organización del backend en módulos, controladores, servicios, repositorios e inyección de dependencias. Esta estructura favorece la aplicación de principios SOLID y permite separar responsabilidades.

###  React + Vite

React permite construir una interfaz web modular basada en componentes reutilizables. Vite agiliza el desarrollo y reduce el tiempo de arranque del entorno frontend.

### PostgreSQL

PostgreSQL se utiliza por su robustez para manejar datos relacionales, restricciones, transacciones e índices. Cada dominio puede mantener su propia base o esquema de datos, respetando la independencia de servicios.

### RabbitMQ

RabbitMQ se utiliza para desacoplar procesos críticos como reservas y pagos. Esto permite que las operaciones ingresen a una cola y sean procesadas por consumidores independientes.

### Docker Compose

Docker Compose facilita levantar múltiples servicios de forma coordinada. Permite ejecutar el frontend, backend, bases de datos y RabbitMQ con una configuración controlada.

### JWT

JWT permite transportar claims esenciales del usuario, como id, nombre, correo y rol. Esto facilita proteger rutas y diferenciar entre usuarios comunes y administradores.

### GitHub Actions

GitHub Actions automatiza el ciclo de integración y despliegue. Permite ejecutar pruebas, construir imágenes, publicarlas y desplegar hacia la VM de forma controlada.

### Docker Hub

Docker Hub se utiliza como registry público de artefactos Docker. Permite almacenar imágenes precompiladas y descargarlas desde la VM durante el despliegue.

### AWS EC2 / VM

AWS proporciona la infraestructura de nube utilizada para desplegar el sistema en una máquina virtual. Esto permite simular un entorno productivo o de evaluación real.

### Jest

Jest se utiliza para pruebas unitarias del backend. Permite validar lógica de servicios, controladores y componentes críticos, además de generar evidencia de cobertura.

### CSV

CSV se utiliza como formato simple, portable y compatible para carga masiva de películas. Es fácil de generar desde hojas de cálculo y sencillo de procesar desde backend.

---

## Conclusión

El proyecto FilmStars se construyó aplicando separación de responsabilidades, arquitectura orientada a servicios, autenticación basada en JWT, persistencia independiente por dominio, comunicación asíncrona mediante RabbitMQ y despliegue mediante contenedores.

Con la Fase 4, el sistema se fortalece en dos frentes principales. En la parte funcional, se mejora la administración de datos mediante carga masiva de películas por CSV y se optimiza la experiencia del usuario con paginación del lado del servidor. En la parte operativa, se mejora la estabilidad del despliegue mediante imágenes inmutables publicadas en Docker Hub y desplegadas en VM sin construir código en producción.

Esta evolución permite que FilmStars sea una plataforma más mantenible, escalable, segura y preparada para operar con mayor volumen de información y despliegues más controlados.

---
