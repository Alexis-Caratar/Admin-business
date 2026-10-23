-- Revierte 011_tiqueteras: borra tiqueteras, consumos y su configuración.
-- Las ventas pagadas con tiquetera se conservan (con su pago 'TIQUERERA').
DROP TRIGGER IF EXISTS trg_tiqueteras_anulacion ON public.ventas;
DROP FUNCTION IF EXISTS public.tiqueteras_por_anulacion();
DROP TABLE IF EXISTS public.tiqueteras_idempotencia;
DROP TABLE IF EXISTS public.tiqueteras_consumos;
DROP TABLE IF EXISTS public.tiqueteras;
DROP TABLE IF EXISTS public.tiqueteras_tipos;
ALTER TABLE public.productos DROP COLUMN IF EXISTS tiquetera_elegible;
ALTER TABLE public.categorias DROP COLUMN IF EXISTS tiquetera_elegible;
