# Esquema back

Estructura base del backend SOA para que el equipo continue la implementacion.

```text
FilmStars/
├── api-gateway/              # Punto de entrada unico NestJS
├── users-service/            # Servicio de Usuario NestJS
├── movies-service/           # Servicio de Peliculas / Cartelera
├── reservations-service/     # Servicio de Reservas / Asientos
├── payments-service/         # Servicio de Pagos
├── rabbitmq/                 # Broker de mensajeria
├── database/                 # Scripts y esquemas SQL
├── frontend/                 # React + Vite
└── docker-compose.yml        # Orquestacion actual de usuario/gateway/db-users
```

Los servicios nuevos deberian seguir el patron NestJS usado por `users-service`: controlador, servicio, repositorio, interfaces, DTOs y acceso directo a PostgreSQL mediante `pg`.
