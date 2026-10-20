-- Revierte 003_tipos_negocio. negocios.tipo (texto) se conserva.
ALTER TABLE public.negocios_sitio DROP COLUMN IF EXISTS franja_texto;
ALTER TABLE public.negocios DROP COLUMN IF EXISTS tipo_negocio;
DROP TABLE IF EXISTS public.tipos_negocio;
