-- Revierte 002_sitio_negocios. Borra el contenido de los sitios y los horarios por día.
DROP TABLE IF EXISTS public.negocios_sitio;
DROP TABLE IF EXISTS public.negocios_horarios;
ALTER TABLE public.negocios
    DROP CONSTRAINT IF EXISTS negocios_url_negocio_formato,
    DROP CONSTRAINT IF EXISTS negocios_url_negocio_key,
    DROP CONSTRAINT IF EXISTS negocios_dominio_key,
    DROP COLUMN IF EXISTS url_negocio,
    DROP COLUMN IF EXISTS dominio,
    DROP COLUMN IF EXISTS whatsapp,
    DROP COLUMN IF EXISTS latitud,
    DROP COLUMN IF EXISTS longitud,
    DROP COLUMN IF EXISTS google_maps_url;
