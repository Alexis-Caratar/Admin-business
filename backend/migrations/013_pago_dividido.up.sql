-- =====================================================================
-- 013 · Pago dividido (una cuenta pagada con varios medios)
-- Aplicar:  node scripts/migrar.js up 013_pago_dividido
-- Revertir: node scripts/migrar.js down 013_pago_dividido
--
-- La venta sigue teniendo un solo pago (pagos), con metodo_pago = 'MIXTO';
-- el desglose (NEQUI 10.000 + EFECTIVO 14.000) va en pagos_medios.
-- v_pagos_medios devuelve un renglón por medio: para los pagos de siempre, el
-- mismo pago; para los mixtos, cada medio. Arqueo, cierre y flujo de caja suman
-- por medio desde esta vista, así cada peso cuenta donde entró.
-- =====================================================================
CREATE TABLE public.pagos_medios (
    id serial PRIMARY KEY,
    id_pago bigint NOT NULL REFERENCES public.pagos(id) ON DELETE CASCADE,
    metodo_pago character varying(20) NOT NULL CHECK (metodo_pago IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA')),
    monto numeric(12,2) NOT NULL CHECK (monto > 0),
    monto_recibido numeric(12,2),            -- solo efectivo: lo que entregó el cliente
    cambio numeric(12,2),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_pagos_medios_pago ON public.pagos_medios (id_pago);

CREATE VIEW public.v_pagos_medios AS
  SELECT pg.id AS id_pago, pg.id_venta, pg.estado_pago, pg.fecha, pm.metodo_pago, pm.monto AS monto_pagado
  FROM public.pagos pg JOIN public.pagos_medios pm ON pm.id_pago = pg.id
  UNION ALL
  SELECT pg.id, pg.id_venta, pg.estado_pago, pg.fecha, pg.metodo_pago, pg.monto_pagado
  FROM public.pagos pg
  WHERE NOT EXISTS (SELECT 1 FROM public.pagos_medios pm WHERE pm.id_pago = pg.id);
