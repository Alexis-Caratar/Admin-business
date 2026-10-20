-- =====================================================================
-- 006 · Ficha de producto para la tienda web
-- Aplicar:  node scripts/migrar.js up 006_ficha_producto
-- Revertir: node scripts/migrar.js down 006_ficha_producto
-- Solo agrega columnas opcionales: los productos existentes no cambian.
-- =====================================================================
ALTER TABLE public.productos
    ADD COLUMN marca character varying(80),
    ADD COLUMN descripcion_detallada text,
    ADD COLUMN caracteristicas jsonb NOT NULL DEFAULT '[]',   -- ["Larga duración", …]
    ADD COLUMN atributos jsonb NOT NULL DEFAULT '[]',         -- [{"nombre":"Tonalidad","valor":"Rojo carmesí"}, …]
    ADD COLUMN modo_uso text,
    ADD COLUMN ingredientes text,
    ADD COLUMN cuidados text,
    ADD COLUMN advertencias text,
    ADD COLUMN fabricante character varying(150),
    ADD COLUMN destacado boolean NOT NULL DEFAULT false,
    -- Variantes: cada variante es un producto real (precio, stock, imágenes y código
    -- propios) que apunta a su producto base. Carrito, pedidos, ventas e inventario
    -- funcionan igual que con cualquier producto.
    ADD COLUMN id_producto_base integer REFERENCES public.productos(id) ON DELETE SET NULL,
    ADD COLUMN variante_nombre character varying(80),
    ADD COLUMN variante_color character varying(7),
    ADD CONSTRAINT productos_variante_color_formato CHECK (variante_color IS NULL OR variante_color ~ '^#[0-9A-Fa-f]{6}$'),
    ADD CONSTRAINT productos_variante_no_propia CHECK (id_producto_base IS NULL OR id_producto_base <> id);

CREATE INDEX idx_productos_base ON public.productos (id_producto_base) WHERE id_producto_base IS NOT NULL;
