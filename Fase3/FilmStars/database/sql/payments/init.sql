CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id_ref UUID NOT NULL,
    usuario_id_ref UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'GTQ',
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    metodo_pago VARCHAR(50) NOT NULL,
    proveedor_ref VARCHAR(150),
    procesado_en TIMESTAMP,
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pago_estado
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'FALLIDO')),

    CONSTRAINT chk_pago_monto
        CHECK (monto >= 0)
);

CREATE TABLE IF NOT EXISTS detalle_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_detalle_pago_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_detalle_pago_subtotal
        CHECK (subtotal >= 0)
);

CREATE TABLE IF NOT EXISTS boleto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    reserva_id_ref UUID NOT NULL,
    reserva_asiento_id_ref UUID NULL,
    codigo_boleto VARCHAR(100) NOT NULL UNIQUE,
    codigo_qr TEXT,
    estado VARCHAR(50) NOT NULL DEFAULT 'EMITIDO',
    creado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_boleto_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_boleto_estado
        CHECK (estado IN ('EMITIDO', 'USADO', 'ANULADO'))
);

CREATE TABLE IF NOT EXISTS reembolso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    procesado_en TIMESTAMP,

    CONSTRAINT fk_reembolso_pago
        FOREIGN KEY (pago_id)
        REFERENCES pago(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_reembolso_estado
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PROCESADO')),

    CONSTRAINT chk_reembolso_monto
        CHECK (monto >= 0)
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

CREATE INDEX IF NOT EXISTS idx_pago_reserva_id_ref
ON pago(reserva_id_ref);

CREATE INDEX IF NOT EXISTS idx_pago_usuario_id_ref
ON pago(usuario_id_ref);

CREATE INDEX IF NOT EXISTS idx_pago_estado
ON pago(estado);

CREATE INDEX IF NOT EXISTS idx_detalle_pago_pago_id
ON detalle_pago(pago_id);

CREATE INDEX IF NOT EXISTS idx_boleto_pago_id
ON boleto(pago_id);

CREATE INDEX IF NOT EXISTS idx_boleto_reserva_id_ref
ON boleto(reserva_id_ref);

CREATE INDEX IF NOT EXISTS idx_boleto_reserva_asiento_id_ref
ON boleto(reserva_asiento_id_ref);

CREATE INDEX IF NOT EXISTS idx_reembolso_pago_id
ON reembolso(pago_id);

CREATE INDEX IF NOT EXISTS idx_mensajeria_estado
ON mensajeria(estado);

CREATE INDEX IF NOT EXISTS idx_mensajeria_tipo_evento
ON mensajeria(tipo_evento);