# Justificación general del proyecto FilmStars

FilmStars es una plataforma web para la venta de boletos de cine en línea. El objetivo principal del proyecto es permitir que los usuarios consulten cartelera, seleccionen ciudad y cine, visualicen funciones disponibles, seleccionen asientos, realicen una reserva, procesen un pago simulado y obtengan un boleto final.

La segunda fase del proyecto realiza el diseño arquitectónico de la fase anterior hacia una implementación funcional, agregando autenticación con JWT, frontend integrado, backend orientado a servicios, comunicación asíncrona mediante RabbitMQ y despliegue local mediante Docker Compose.

## Implementación de Solución

Se construyó una solución dividida en componentes independientes:

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite + TypeScript | Interfaz web para usuarios, consulta de cartelera, login, registro y flujo visual de compra. |
| API Gateway | NestJS + TypeScript | Punto de entrada único, enrutamiento hacia servicios internos y validación de JWT en rutas protegidas. |
| Users Service | NestJS + TypeScript + PostgreSQL | Registro, inicio de sesión, emisión de JWT y gestión de usuarios. |
| Movies Service | NestJS + TypeScript + PostgreSQL | Consulta de ciudades, cines, cartelera, películas y funciones. |
| Reservations Service | PostgreSQL + estructura base | Persistencia diseñada para reservas, asientos por función y estados de disponibilidad. |
| Payments Service | PostgreSQL + estructura base | Persistencia diseñada para pagos, detalles de pago, boletos y reembolsos. |
| RabbitMQ | RabbitMQ Management | Broker de mensajería para desacoplar procesos críticos como reservas y pagos. |
| Docker Compose | Docker | Orquestación local de servicios, bases de datos y RabbitMQ. |

## Aplicación de Arquitectura

Se utilizó una arquitectura orientada a servicios porque el sistema contiene dominios de negocio con responsabilidades distintas. Separar usuarios, cartelera, reservas y pagos permite que cada parte pueda evolucionar, probarse y mantenerse de manera independiente.

Además, la venta de boletos requiere manejar concurrencia, especialmente cuando varios usuarios intentan seleccionar el mismo asiento al mismo tiempo. Por esa razón, el diseño contempla un servicio de reservas desacoplado y comunicación asíncrona mediante RabbitMQ para evitar bloquear el flujo principal de la aplicación.

## Decisiones Técnicas

Las decisiones técnicas buscan cumplir los siguientes objetivos:

| Decisión | Propósito |
|---|---|
| API Gateway | Centralizar el acceso desde el frontend y proteger rutas mediante JWT. |
| Servicios separados | Reducir acoplamiento y mejorar mantenibilidad. |
| PostgreSQL por servicio | Mantener independencia de datos por dominio. |
| RabbitMQ | Procesar operaciones críticas de forma asíncrona y desacoplada. |
| Docker Compose | Levantar todo el entorno local con un solo comando. |
| TypeScript | Mejorar mantenibilidad y reducir errores de tipado. |
| NestJS | Organizar el backend con módulos, controladores, servicios e inyección de dependencias. |
| React + Vite | Construir una interfaz rápida, modular y fácil de integrar con APIs. |

## Flujo del Sistema

1. El usuario accede al frontend.
2. El frontend se comunica con el API Gateway.
3. El usuario puede registrarse o iniciar sesión.
4. El users-service valida credenciales y genera un JWT.
5. El frontend almacena el token y lo envía en la cabecera `Authorization: Bearer <token>`.
6. El usuario consulta ciudades, cines, películas y funciones desde el movies-service.
7. El usuario selecciona una función y asientos.
8. La reserva debe procesarse por el servicio de reservas, validando disponibilidad y bloqueando temporalmente los asientos.
9. El pago debe procesarse por el servicio de pagos.
10. Al confirmarse el pago, el sistema emite el boleto final.

## Estado de Funcionalidades

| Área | Estado |
|---|---|
| Autenticación y JWT | Implementado en users-service y API Gateway. |
| Gestión de usuarios | Implementado parcialmente. |
| Consulta de cartelera | Implementado en movies-service. |
| Base de datos SOA | Implementada con 4 bases PostgreSQL. |
| RabbitMQ | Configurado en Docker Compose. |
| Reservas y pagos backend | Diseñados a nivel de base de datos; frontend cuenta con mocks temporales. |
| Docker Compose | Implementado para levantar bases, RabbitMQ, API Gateway y servicios implementados. |

## Conclusión General

El proyecto se construyó aplicando separación de responsabilidades, arquitectura orientada a servicios, autenticación basada en JWT y persistencia independiente por dominio. Esta estructura permite que el sistema sea más mantenible, escalable y preparado para integrar procesos asíncronos de reserva y pago.
