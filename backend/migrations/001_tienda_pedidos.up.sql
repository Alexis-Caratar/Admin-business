-- =====================================================================
-- 001 · Tienda web y módulo Pedidos
-- Aplicar:  node scripts/migrar.js up 001_tienda_pedidos
-- Revertir: node scripts/migrar.js down 001_tienda_pedidos
-- Solo agrega objetos nuevos: no modifica ni borra datos existentes.
-- =====================================================================

-- Consecutivo de facturas con secuencia (antes MAX()+1, que puede duplicar
-- números si dos ventas se registran al mismo tiempo).
CREATE SEQUENCE IF NOT EXISTS public.ventas_numero_seq;
SELECT setval('public.ventas_numero_seq', GREATEST((SELECT COALESCE(MAX(numero_consecutivo), 0) FROM public.ventas), 1),
              (SELECT COUNT(*) > 0 FROM public.ventas));

CREATE SEQUENCE IF NOT EXISTS public.pedidos_numero_seq;

-- ---------------------------------------------------------------------
-- Pedidos web
-- estado (operativo): PENDIENTE, CONFIRMADO, EN_PREPARACION, LISTO,
--                     EN_CAMINO, ENTREGADO, CANCELADO
-- estado_pago:        PENDIENTE, APROBADO, RECHAZADO, ANULADO, REEMBOLSO_PENDIENTE
-- ---------------------------------------------------------------------
CREATE TABLE public.pedidos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id),
    codigo character varying(20) NOT NULL UNIQUE,
    token_consulta character varying(64) NOT NULL UNIQUE,
    id_cliente integer REFERENCES public.personas(id),
    nombre_cliente character varying(150) NOT NULL,
    telefono character varying(30) NOT NULL,
    email character varying(120),
    tipo_entrega character varying(20) NOT NULL CHECK (tipo_entrega IN ('DOMICILIO', 'RECOGER')),
    direccion character varying(250),
    barrio character varying(120),
    referencias character varying(300),
    observacion character varying(500),
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    costo_domicilio numeric(12,2) NOT NULL DEFAULT 0 CHECK (costo_domicilio >= 0),
    total numeric(12,2) NOT NULL CHECK (total >= 0),
    metodo_pago character varying(20) NOT NULL CHECK (metodo_pago IN ('EN_LINEA', 'CONTRAENTREGA')),
    estado character varying(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO')),
    estado_pago character varying(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_pago IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'REEMBOLSO_PENDIENTE')),
    id_venta bigint UNIQUE REFERENCES public.ventas(id),
    id_caja integer REFERENCES public.caja(id),
    clave_idempotencia character varying(80) UNIQUE,
    version integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CHECK (tipo_entrega <> 'DOMICILIO' OR direccion IS NOT NULL)
);
CREATE INDEX idx_pedidos_negocio_fecha ON public.pedidos (id_negocio, created_at DESC);
CREATE INDEX idx_pedidos_negocio_estado ON public.pedidos (id_negocio, estado);
CREATE INDEX idx_pedidos_telefono ON public.pedidos (telefono);

-- Ítems del pedido. Los adicionales apuntan a su plato con id_item_padre.
-- nombre y precio_unitario son una copia al momento de la compra.
CREATE TABLE public.pedidos_items (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    id_producto integer NOT NULL REFERENCES public.productos(id),
    id_item_padre bigint REFERENCES public.pedidos_items(id) ON DELETE CASCADE,
    nombre character varying(150) NOT NULL,
    cantidad integer NOT NULL CHECK (cantidad > 0),
    precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0)
);
CREATE INDEX idx_pedidos_items_pedido ON public.pedidos_items (id_pedido);

-- Auditoría: cada cambio de estado o de pago, quién y cuándo
CREATE TABLE public.pedidos_historial (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    campo character varying(20) NOT NULL CHECK (campo IN ('estado', 'estado_pago', 'nota')),
    valor_anterior character varying(30),
    valor_nuevo character varying(30),
    id_usuario integer REFERENCES public.usuarios(id),
    origen character varying(20) NOT NULL DEFAULT 'ADMIN',   -- ADMIN, CLIENTE, PASARELA, CAJA
    nota character varying(500),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_historial_pedido ON public.pedidos_historial (id_pedido, created_at);

-- Intentos de pago en la pasarela (uno por intento; referencia única)
CREATE TABLE public.pedidos_transacciones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    proveedor character varying(20) NOT NULL DEFAULT 'WOMPI',
    referencia character varying(60) NOT NULL UNIQUE,
    id_transaccion_proveedor character varying(80) UNIQUE,
    estado character varying(20) NOT NULL DEFAULT 'CREADA',  -- CREADA, PENDING, APPROVED, DECLINED, VOIDED, ERROR
    monto_centavos bigint NOT NULL CHECK (monto_centavos > 0),
    moneda character varying(3) NOT NULL DEFAULT 'COP',
    metodo character varying(30),                          -- CARD, PSE, NEQUI... (sin datos sensibles)
    respuesta jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_transacciones_pedido ON public.pedidos_transacciones (id_pedido);

-- Eventos de webhook recibidos: evita procesar dos veces la misma notificación
CREATE TABLE public.pagos_webhook_eventos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    proveedor character varying(20) NOT NULL,
    id_evento character varying(128) NOT NULL,
    evento character varying(60),
    firma_valida boolean NOT NULL,
    payload jsonb,
    recibido_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (proveedor, id_evento)
);

-- ---------------------------------------------------------------------
-- Módulo "Pedidos" en el menú de Adminbusiness: se habilita en los
-- negocios que ya tienen "cajero" y para los usuarios que ya lo usan.
-- ---------------------------------------------------------------------
INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema)
SELECT 'pedidos', 'Pedidos', 'ReceiptLongIcon', 11, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'pedidos');

INSERT INTO public.app_modulos_negocio (id_modulo, id_negocio, activo)
SELECT p.id, mn.id_negocio, true
FROM public.app_modulos p
JOIN public.app_modulos c ON c.url = 'cajero'
JOIN public.app_modulos_negocio mn ON mn.id_modulo = c.id AND mn.activo
WHERE p.url = 'pedidos'
  AND NOT EXISTS (SELECT 1 FROM public.app_modulos_negocio x WHERE x.id_modulo = p.id AND x.id_negocio = mn.id_negocio);

INSERT INTO public.app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo)
SELECT um.id_usuario, p.id, true
FROM public.app_modulos p
JOIN public.app_modulos c ON c.url = 'cajero'
JOIN public.app_usuario_modulos um ON um.id_modulo_negocio_rol = c.id AND um.activo
WHERE p.url = 'pedidos'
ON CONFLICT (id_usuario, id_modulo_negocio_rol) DO NOTHING;
