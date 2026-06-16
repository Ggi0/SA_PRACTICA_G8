CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS ciudad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ciudad_id UUID NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cine_ciudad
        FOREIGN KEY (ciudad_id)
        REFERENCES ciudad(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sala (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cine_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    capacidad INT NOT NULL,
    tipo_sala VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sala_cine
        FOREIGN KEY (cine_id)
        REFERENCES cine(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sala_id UUID NOT NULL,
    fila VARCHAR(10) NOT NULL,
    numero INT NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_asiento_sala
        FOREIGN KEY (sala_id)
        REFERENCES sala(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_asiento_fila_numero
        UNIQUE (sala_id, fila, numero),

    CONSTRAINT uq_asiento_codigo
        UNIQUE (sala_id, codigo)
);

CREATE TABLE IF NOT EXISTS genero (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pelicula (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(200) NOT NULL,
    sinopsis TEXT,
    duracion_min INT NOT NULL,
    clasificacion VARCHAR(50),
    poster_url TEXT,
    fecha_estreno DATE,
    tipo VARCHAR(50) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pelicula_tipo
        CHECK (tipo IN ('ESTRENO', 'PREVENTA', 'REESTRENO'))
);

CREATE TABLE IF NOT EXISTS pelicula_genero (
    pelicula_id UUID NOT NULL,
    genero_id UUID NOT NULL,

    PRIMARY KEY (pelicula_id, genero_id),

    CONSTRAINT fk_pelicula_genero_pelicula
        FOREIGN KEY (pelicula_id)
        REFERENCES pelicula(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pelicula_genero_genero
        FOREIGN KEY (genero_id)
        REFERENCES genero(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS funcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pelicula_id UUID NOT NULL,
    sala_id UUID NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_funcion_pelicula
        FOREIGN KEY (pelicula_id)
        REFERENCES pelicula(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_funcion_sala
        FOREIGN KEY (sala_id)
        REFERENCES sala(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cine_ciudad_id 
ON cine(ciudad_id);

CREATE INDEX IF NOT EXISTS idx_sala_cine_id 
ON sala(cine_id);

CREATE INDEX IF NOT EXISTS idx_asiento_sala_id 
ON asiento(sala_id);

CREATE INDEX IF NOT EXISTS idx_pelicula_tipo 
ON pelicula(tipo);

CREATE INDEX IF NOT EXISTS idx_funcion_pelicula_id 
ON funcion(pelicula_id);

CREATE INDEX IF NOT EXISTS idx_funcion_sala_id 
ON funcion(sala_id);

CREATE INDEX IF NOT EXISTS idx_funcion_fecha_hora 
ON funcion(fecha_hora);