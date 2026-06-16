# CineMax Frontend

Interfaz web para el sistema de venta de boletos de cine.
Construido con React + Vite + TypeScript + Tailwind CSS.

## Requisitos previos

Asegúrate de tener instalado:

- **Node.js** v18 o superior → https://nodejs.org
- **npm** v9 o superior (viene con Node.js)

Para verificar tu versión corre:
```bash
node --version
npm --version
```

## Instalación y ejecución

```bash
# 1. Clona el repositorio
git clone <url-del-repo>

# 2. Entra a la carpeta del frontend
cd Fase2/client

# 3. Instala las dependencias
npm install

# 4. Crea el archivo de variables de entorno
cp .env.example .env

# 5. Corre el servidor de desarrollo
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:
VITE_API_URL=http://localhost:3000
VITE_USE_MOCK=true

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores:
- `VITE_USE_MOCK=true` → usa datos falsos, no necesita backend
- `VITE_USE_MOCK=false` → conecta al backend real

## Usuarios de prueba (modo mock)

| Email | Contraseña | Rol |
|---|---|---|
| ana@email.com | 1234 | Usuario |
| admin@cinemax.com | 1234 | Admin |

## Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Documentación de integración con backend

Ver el archivo `FRONTEND_DOCS.md` para la documentación
completa de endpoints, flujos y cómo conectar cada servicio.