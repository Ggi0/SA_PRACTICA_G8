FROM postgres:15

# Variables por defecto (puedes cambiarlas en docker-compose)
ENV POSTGRES_DB=filmstars_reservations
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres123

# Copia el script SQL para ejecución automática
COPY init.sql /docker-entrypoint-initdb.d/
