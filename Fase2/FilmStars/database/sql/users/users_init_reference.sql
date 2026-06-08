-- FilmStars - Users Service schema reference
-- Compatible con la implementacion actual de users-service.
-- Acceso a datos: PostgreSQL directo mediante pg, sin ORM.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'customer')) DEFAULT 'customer',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  telefono VARCHAR(30),
  dpi VARCHAR(30),
  fecha_nacimiento DATE,
  direccion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
ON users (LOWER(email));

-- Nota:
-- El backend actual genera el UUID desde Node.js usando randomUUID().
-- Por eso la columna id no tiene DEFAULT uuid_generate_v4().
--
-- Roles esperados por el JWT y los guards:
-- - admin
-- - customer
--
-- Este esquema corresponde a:
-- Fase2/FilmStars/users-service/src/users/user.repository.ts
