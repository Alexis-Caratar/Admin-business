-- Revierte 006_ficha_producto (borra la ficha web y las relaciones de variantes).
DROP INDEX IF EXISTS public.idx_productos_base;
ALTER TABLE public.productos
    DROP CONSTRAINT IF EXISTS productos_variante_no_propia,
    DROP CONSTRAINT IF EXISTS productos_variante_color_formato,
    DROP COLUMN IF EXISTS variante_color,
    DROP COLUMN IF EXISTS variante_nombre,
    DROP COLUMN IF EXISTS id_producto_base,
    DROP COLUMN IF EXISTS destacado,
    DROP COLUMN IF EXISTS fabricante,
    DROP COLUMN IF EXISTS advertencias,
    DROP COLUMN IF EXISTS cuidados,
    DROP COLUMN IF EXISTS ingredientes,
    DROP COLUMN IF EXISTS modo_uso,
    DROP COLUMN IF EXISTS atributos,
    DROP COLUMN IF EXISTS caracteristicas,
    DROP COLUMN IF EXISTS descripcion_detallada,
    DROP COLUMN IF EXISTS marca;
