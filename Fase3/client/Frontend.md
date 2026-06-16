# CineMax Frontend — Documentación de Integración

## Stack
- React 18 + Vite 5
- TypeScript
- Tailwind CSS v3
- shadcn/ui (componentes)
- React Query (caché y fetching)
- Zustand (estado global del checkout)
- React Router v6

---

## Estructura de carpetas
```
src/
├── components/
│   ├── auth/         # LoginForm, RegisterForm
│   ├── checkout/     # PaymentForm
│   ├── layout/       # Navbar, Footer, MainLayout
│   ├── movies/       # MovieCard, MovieGrid, ShowtimeSelector
│   ├── seats/        # SeatMap
│   ├── shared/       # CitySelector
│   └── ui/           # Componentes shadcn (Button, Input, etc.)
├── context/
│   ├── AuthContext.tsx      # Sesión del usuario + JWT
│   └── checkoutStore.ts     # Estado del flujo de compra (Zustand)
├── hooks/
│   └── useMoviesData.ts     # React Query hooks
├── pages/                   # Una página por ruta
├── routes/
│   └── AppRoutes.tsx        # Definición de rutas
├── services/
│   ├── api/                 # ← AQUÍ se conecta el backend
│   │   ├── authService.ts
│   │   ├── moviesService.ts
│   │   ├── reservationsService.ts
│   │   └── paymentsService.ts
│   └── mock/
│       └── mockData.ts      # Datos de prueba (eliminar al conectar)
└── types/
└── index.ts             # Tipos TypeScript de todos los dominios
```
---

## Cómo conectar el backend

### Paso 1 — Configurar la URL base

Crea un archivo `.env` en la raíz del proyecto:
``` 
VITE_API_URL=http://localhost:3000 
```
```
 VITE_USE_MOCK=false
  ```
- `VITE_API_URL` apunta al API Gateway (NestJS)
- `VITE_USE_MOCK=false` desactiva los datos falsos

### Paso 2 — Descomentar axios en cada servicio

En cada archivo de `src/services/api/`, hay bloques comentados
con las llamadas reales. Solo descomenta y elimina el bloque mock.

**Ejemplo en `authService.ts`:**
```ts
// ANTES (mock):
await delay(600)
const user = MOCK_USERS.find(...)
...

// DESPUÉS (real):
const { data } = await httpClient.post<AuthResponse>('/auth/login', credentials)
return data
```

---

## Servicios y sus endpoints esperados

### AUTH SERVICE — `src/services/api/authService.ts`
Corresponde al **Servicio de Usuarios** del backend SOA.

| Función | Método | Endpoint | Body | Respuesta |
|---|---|---|---|---|
| `login()` | POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| `register()` | POST | `/auth/register` | `{ name, email, password }` | `{ token, user }` |

**JWT esperado:** El token debe ser un JWT firmado con los claims:
```json
{
  "sub": "user-id",
  "name": "Nombre",
  "role": "USER | ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```
El frontend lo guarda en `localStorage` con la clave `auth_token`
y lo envía automáticamente en cada request como:
` Authorization: Bearer <token> `

---

### MOVIES SERVICE — `src/services/api/moviesService.ts`
Corresponde al **Servicio de Películas/Cartelera**.

| Función | Método | Endpoint | Params | Respuesta |
|---|---|---|---|---|
| `getCities()` | GET | `/movies/cities` | — | `City[]` |
| `getCinemasByCity()` | GET | `/movies/cinemas` | `?cityId=` | `Cinema[]` |
| `getMovies()` | GET | `/movies` | `?category=` | `Movie[]` |
| `getMovieById()` | GET | `/movies/:id` | — | `Movie` |
| `getShowtimes()` | GET | `/movies/showtimes` | `?movieId=&cityId=` | `Showtime[]` |
| `getShowtimeById()` | GET | `/movies/showtimes/:id` | — | `Showtime` |

**Categorías válidas:** `ESTRENO | PRE_VENTA | RE_ESTRENO`
**Tipos de proyección:** `STANDARD | 3D | IMAX | 4DX`

---

### RESERVATIONS SERVICE — `src/services/api/reservationsService.ts`
Corresponde al **Servicio de Reservas/Asientos**.

| Función | Método | Endpoint | Body | Respuesta |
|---|---|---|---|---|
| `getSeatsByShowtime()` | GET | `/reservations/showtimes/:id/seats` | — | `Seat[]` |
| `blockSeats()` | POST | `/reservations/block` | `{ showtimeId, seatIds }` | `{ reservationId }` |
| `confirmReservation()` | POST | `/reservations/:id/confirm` | `{ totalAmount }` | `{ accepted, message }` |

**Estados de asiento:** `AVAILABLE | OCCUPIED | SELECTED | BLOCKED_TEMP`

**Importante — Bloqueo temporal:**
- `blockSeats()` usa `SELECT ... FOR UPDATE` en PostgreSQL para
  evitar condiciones de carrera
- Si el asiento ya está bloqueado devuelve **HTTP 409 Conflict**
- El frontend maneja el 409 mostrando un toast de error
- El bloqueo expira en **10 minutos** automáticamente

**Importante — Confirmación asíncrona:**
- `confirmReservation()` publica el evento `reserva.solicitada`
  en RabbitMQ y devuelve **HTTP 202 Accepted** inmediatamente
- El frontend no espera el procesamiento, solo confirma que
  fue aceptado en la cola

---

### PAYMENTS SERVICE — `src/services/api/paymentsService.ts`
Corresponde al **Servicio de Pagos**.

| Función | Método | Endpoint | Body | Respuesta |
|---|---|---|---|---|
| `processPayment()` | POST | `/payments/process` | `PaymentRequest` | `PaymentResult` |
| `getTicket()` | GET | `/payments/tickets/:reservationId` | — | `Ticket` |

**Flujo completo del pago:**
1. Frontend llama `confirmReservation()` → publica a RabbitMQ
2. Frontend llama `processPayment()` → consumidor procesa la cola
3. Si `status === 'APPROVED'` → frontend llama `getTicket()`
4. El boleto se muestra en `ConfirmationPage`

**Estados de pago:** `PENDING | APPROVED | REJECTED`

---

## Flujo completo de compra
```
HomePage
→ elige ciudad (guarda en checkoutStore)
→ elige función (ShowtimeSelector)
→ navega a /showtimes/:id/seats
SeatsPage
→ selecciona asientos (SeatMap)
→ click "Continuar" → llama blockSeats()
→ si éxito → guarda reservationId en checkoutStore
→ navega a /checkout
CheckoutPage
→ muestra PaymentForm + resumen
→ click "Pagar" → llama confirmReservation() + processPayment()
→ si APPROVED → llama getTicket()
→ checkoutStore.step cambia a 'confirmation'
→ navega automáticamente a /confirmation
ConfirmationPage
→ muestra el boleto final
→ click "Volver" → reset del checkoutStore
```

---

## Estado global (Zustand — checkoutStore)

```ts
{
  selectedCity: string | null
  selectedMovie: Movie | null
  selectedShowtime: Showtime | null
  selectedSeats: Seat[]
  reservationId: string | null
  ticket: Ticket | null
  step: 'movie' | 'showtime' | 'seats' | 'payment' | 'confirmation'
}
```

---

## Rutas protegidas

Las siguientes rutas requieren JWT válido.
Si el usuario no está autenticado, redirige a `/login`:

- `/movies/:movieId`
- `/showtimes/:showtimeId/seats`
- `/checkout`
- `/confirmation`

---
