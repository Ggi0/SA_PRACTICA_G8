#!/bin/bash
# Ejecutar desde la raíz del proyecto: reservas-service/
# Instala las dependencias necesarias para el servicio

npm install \
  @nestjs/config \
  @nestjs/typeorm \
  @nestjs/schedule \
  typeorm \
  pg \
  class-validator \
  class-transformer \
  jsonwebtoken \
  @types/jsonwebtoken

echo "✓ Dependencias instaladas correctamente"