CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reserva (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id_ref UUID NOT NULL,
    funcion_id_ref UUID NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    precio_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    referencia_pago_ref UUID,
    expira_en TIMESTAMP NOT NULL,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_reserva_estado
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA'))
);

CREATE TABLE IF NOT EXISTS estado_asiento_funcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funcion_id_ref UUID NOT NULL,
    asiento_id_ref UUID NOT NULL,
    codigo_asiento VARCHAR(20) NOT NULL,
    fila VARCHAR(10) NOT NULL,
    numero INT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'DISPONIBLE',
    reserva_id UUID,
    bloqueado_hasta TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_estado_asiento_reserva
        FOREIGN KEY (reserva_id)
        REFERENCES reserva(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_funcion_asiento
        UNIQUE (funcion_id_ref, asiento_id_ref),

    CONSTRAINT chk_estado_asiento
        CHECK (estado IN ('DISPONIBLE', 'BLOQUEADO', 'OCUPADO'))
);

CREATE TABLE IF NOT EXISTS reserva_asiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL,
    estado_asiento_funcion_id UUID NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    tipo_entrada VARCHAR(50) NOT NULL DEFAULT 'GENERAL',

    CONSTRAINT fk_reserva_asiento_reserva
        FOREIGN KEY (reserva_id)
        REFERENCES reserva(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reserva_asiento_estado
        FOREIGN KEY (estado_asiento_funcion_id)
        REFERENCES estado_asiento_funcion(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_reserva_asiento
        UNIQUE (reserva_id, estado_asiento_funcion_id)
);

CREATE TABLE IF NOT EXISTS mensajeria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servicio_origen VARCHAR(100) NOT NULL,
    agregado_tipo VARCHAR(100) NOT NULL,
    agregado_id UUID NOT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_procesado TIMESTAMP,

    CONSTRAINT chk_mensajeria_estado
        CHECK (estado IN ('PENDIENTE', 'PUBLICADO', 'PROCESADO', 'FALLIDO'))
);

CREATE INDEX IF NOT EXISTS idx_reserva_usuario_id_ref
ON reserva(usuario_id_ref);

CREATE INDEX IF NOT EXISTS idx_reserva_funcion_id_ref
ON reserva(funcion_id_ref);

CREATE INDEX IF NOT EXISTS idx_reserva_estado
ON reserva(estado);

CREATE INDEX IF NOT EXISTS idx_estado_asiento_funcion_id_ref
ON estado_asiento_funcion(funcion_id_ref);

CREATE INDEX IF NOT EXISTS idx_estado_asiento_asiento_id_ref
ON estado_asiento_funcion(asiento_id_ref);

CREATE INDEX IF NOT EXISTS idx_estado_asiento_estado
ON estado_asiento_funcion(estado);

CREATE INDEX IF NOT EXISTS idx_reserva_asiento_reserva_id
ON reserva_asiento(reserva_id);

CREATE INDEX IF NOT EXISTS idx_mensajeria_estado
ON mensajeria(estado);

CREATE INDEX IF NOT EXISTS idx_mensajeria_tipo_evento
ON mensajeria(tipo_evento);