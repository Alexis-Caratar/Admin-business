-- =====================================================================
-- 011 · Tiqueteras de almuerzos (prepago) integradas con Ventas
-- Aplicar:  node scripts/migrar.js up 011_tiqueteras
-- Revertir: node scripts/migrar.js down 011_tiqueteras
--
-- Tratamiento financiero:
--  · Vender una tiquetera = el cliente paga por adelantado: entra dinero a la
--    caja (tiqueteras.metodo_pago, id_caja). NO es una venta de producto.
--  · Consumir un almuerzo = venta normal cuyo pago es 'TIQUERERA' por el valor
--    prepagado del almuerzo: es ingreso del período, pero NO dinero nuevo en caja.
--  · Anular la venta reintegra el almuerzo (una sola vez, por trigger).
-- =====================================================================

-- Qué se puede pagar con tiquetera: por categoría (Almuerzos por defecto) con excepción por producto
ALTER TABLE public.categorias ADD COLUMN tiquetera_elegible boolean NOT NULL DEFAULT false;
ALTER TABLE public.productos ADD COLUMN tiquetera_elegible boolean;   -- NULL = lo que diga su categoría
UPDATE public.categorias SET tiquetera_elegible = true WHERE nombre ILIKE '%almuerzo%';

CREATE TABLE public.tiqueteras_tipos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre character varying(60) NOT NULL,
    almuerzos smallint NOT NULL CHECK (almuerzos > 0 AND almuerzos <= 200),
    precio numeric(12,2) NOT NULL CHECK (precio > 0),
    vigencia_dias smallint CHECK (vigencia_dias IS NULL OR vigencia_dias > 0),   -- NULL = sin vencimiento
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.tiqueteras (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    codigo character varying(20) NOT NULL,
    id_cliente integer NOT NULL REFERENCES public.personas(id),
    id_tipo integer REFERENCES public.tiqueteras_tipos(id),
    nombre_tipo character varying(60) NOT NULL,
    almuerzos_total smallint NOT NULL CHECK (almuerzos_total > 0),
    consumidos smallint NOT NULL DEFAULT 0,
    valor_pagado numeric(12,2) NOT NULL CHECK (valor_pagado >= 0),
    valor_almuerzo numeric(12,2) NOT NULL CHECK (valor_almuerzo >= 0),   -- valor_pagado / almuerzos_total
    metodo_pago character varying(20) NOT NULL,
    id_caja integer REFERENCES public.caja(id) ON DELETE SET NULL,      -- caja donde entró el dinero
    fecha_compra timestamp with time zone NOT NULL DEFAULT now(),
    fecha_vencimiento date,
    estado character varying(10) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'AGOTADA', 'ANULADA')),
    token_portal character varying(40) NOT NULL UNIQUE,                  -- enlace del portal del cliente
    id_usuario integer,
    anulada_por integer,
    anulada_en timestamp with time zone,
    motivo_anulacion text,
    CHECK (consumidos >= 0 AND consumidos <= almuerzos_total),
    UNIQUE (id_negocio, codigo)
);
CREATE INDEX idx_tiqueteras_cliente ON public.tiqueteras (id_cliente);
CREATE INDEX idx_tiqueteras_negocio_estado ON public.tiqueteras (id_negocio, estado);

CREATE TABLE public.tiqueteras_consumos (
    id serial PRIMARY KEY,
    id_tiquetera integer NOT NULL REFERENCES public.tiqueteras(id),
    id_venta bigint NOT NULL REFERENCES public.ventas(id),
    id_venta_item bigint REFERENCES public.ventas_items(id) ON DELETE SET NULL,
    id_producto integer NOT NULL REFERENCES public.productos(id),
    cantidad smallint NOT NULL CHECK (cantidad > 0),
    valor_almuerzo numeric(12,2) NOT NULL,
    estado character varying(12) NOT NULL DEFAULT 'CONSUMIDO' CHECK (estado IN ('CONSUMIDO', 'REINTEGRADO')),
    id_usuario integer,                         -- cajero que registró el consumo
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    reintegrado_en timestamp with time zone,
    reintegrado_por integer,
    motivo_reintegro text
);
CREATE INDEX idx_tiqueteras_consumos_tiq ON public.tiqueteras_consumos (id_tiquetera, created_at);
CREATE INDEX idx_tiqueteras_consumos_venta ON public.tiqueteras_consumos (id_venta);

-- Reintentos (doble clic, red): la misma clave devuelve el mismo resultado
CREATE TABLE public.tiqueteras_idempotencia (
    clave character varying(80) PRIMARY KEY,
    id_negocio integer NOT NULL,
    resultado jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Anular la venta reintegra sus almuerzos UNA vez; una venta anulada con
-- consumos reintegrados no se puede reactivar (volvería a descontar).
CREATE OR REPLACE FUNCTION public.tiqueteras_por_anulacion() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  r record;
  quien integer := NULLIF(current_setting('app.id_usuario', true), '')::integer;
BEGIN
  IF NEW.estado = 'cancelado' AND OLD.estado IS DISTINCT FROM 'cancelado' THEN
    FOR r IN
      UPDATE tiqueteras_consumos SET estado = 'REINTEGRADO', reintegrado_en = now(), reintegrado_por = quien, motivo_reintegro = NEW.nota
      WHERE id_venta = NEW.id AND estado = 'CONSUMIDO'
      RETURNING id_tiquetera, cantidad
    LOOP
      UPDATE tiqueteras SET consumidos = consumidos - r.cantidad,
             estado = CASE WHEN estado = 'AGOTADA' THEN 'ACTIVA' ELSE estado END
      WHERE id = r.id_tiquetera;
    END LOOP;
  ELSIF OLD.estado = 'cancelado' AND NEW.estado IS DISTINCT FROM 'cancelado'
        AND EXISTS (SELECT 1 FROM tiqueteras_consumos WHERE id_venta = NEW.id) THEN
    RAISE EXCEPTION 'La venta % fue pagada con tiquetera y está anulada: no se puede reactivar', NEW.numero_factura;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_tiqueteras_anulacion AFTER UPDATE OF estado ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.tiqueteras_por_anulacion();
