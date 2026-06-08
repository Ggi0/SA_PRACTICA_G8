# ─── Etapa 1: Build ───────────────────────────────────────────────────────────
# Construye los archivos estáticos de React
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package.json primero
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Genera el build de producción
RUN npm run build

# ─── Etapa 2: Servidor ────────────────────────────────────────────────────────
# Sirve los archivos estáticos con nginx 
FROM nginx:alpine

# Copia los archivos del build al servidor nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx para que React Router funcione correctamente
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]