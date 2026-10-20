-- =====================================================================
-- 002 · Sitio web dinámico por negocio
-- Aplicar:  node scripts/migrar.js up 002_sitio_negocios
-- Revertir: node scripts/migrar.js down 002_sitio_negocios
-- Agrega columnas y tablas; no borra ni cambia los datos existentes.
-- =====================================================================

-- Identidad pública del negocio
ALTER TABLE public.negocios
    ADD COLUMN url_negocio character varying(80),
    ADD COLUMN dominio character varying(150),
    ADD COLUMN whatsapp character varying(20),
    ADD COLUMN latitud numeric(9,6),
    ADD COLUMN longitud numeric(9,6),
    ADD COLUMN google_maps_url character varying(500);

-- url_negocio a partir del nombre: "Restaurante Punto Urbano" → "restaurante-punto-urbano"
UPDATE public.negocios
SET url_negocio = trim(BOTH '-' FROM regexp_replace(
      lower(translate(nombre, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')), '[^a-z0-9]+', '-', 'g'))
WHERE url_negocio IS NULL;
-- Si dos nombres generan la misma URL, se agrega el id
UPDATE public.negocios n SET url_negocio = n.url_negocio || '-' || n.id
WHERE EXISTS (SELECT 1 FROM public.negocios x WHERE x.url_negocio = n.url_negocio AND x.id < n.id);

ALTER TABLE public.negocios
    ALTER COLUMN url_negocio SET NOT NULL,
    ADD CONSTRAINT negocios_url_negocio_key UNIQUE (url_negocio),
    ADD CONSTRAINT negocios_url_negocio_formato CHECK (url_negocio ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    ADD CONSTRAINT negocios_dominio_key UNIQUE (dominio);

-- Horario por día (0 = domingo … 6 = sábado). Varios rangos por día permitidos.
CREATE TABLE public.negocios_horarios (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_apertura time NOT NULL,
    hora_cierre time NOT NULL,
    CHECK (hora_apertura <> hora_cierre)
);
CREATE INDEX idx_negocios_horarios_negocio ON public.negocios_horarios (id_negocio, dia_semana);

-- Contenido del sitio y configuración de la tienda (1 a 1 con negocios)
CREATE TABLE public.negocios_sitio (
    id_negocio integer PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
    publicado boolean NOT NULL DEFAULT false,
    nombre_publico character varying(150),
    eslogan character varying(200),
    frases jsonb NOT NULL DEFAULT '[]',          -- textos rotativos del inicio
    imagen_portada jsonb,                         -- {src, alt}
    nosotros_titulo character varying(120),
    nosotros_texto character varying(600),
    nosotros_items jsonb NOT NULL DEFAULT '[]',   -- [{titulo, texto, foto:{src,alt}}]
    imagen_franja jsonb,                          -- {src, alt}
    galeria jsonb NOT NULL DEFAULT '[]',          -- [{src, alt, forma}]
    servicios character varying(300),
    redes jsonb NOT NULL DEFAULT '[]',            -- [{nombre, url}]
    mensaje_whatsapp character varying(300),
    seo_titulo character varying(160),
    seo_descripcion character varying(300),
    tema character varying(10) NOT NULL DEFAULT 'dark' CHECK (tema IN ('dark', 'light')),
    mostrar_fotos_productos boolean NOT NULL DEFAULT false,
    -- Tienda en línea
    tienda_activa boolean NOT NULL DEFAULT false,
    tienda_permite_domicilio boolean NOT NULL DEFAULT true,
    tienda_permite_recoger boolean NOT NULL DEFAULT true,
    tienda_permite_contraentrega boolean NOT NULL DEFAULT true,
    tienda_costo_domicilio numeric(12,2) NOT NULL DEFAULT 0 CHECK (tienda_costo_domicilio >= 0),
    tienda_domicilio_gratis_desde numeric(12,2) NOT NULL DEFAULT 0 CHECK (tienda_domicilio_gratis_desde >= 0),
    tienda_pedido_minimo numeric(12,2) NOT NULL DEFAULT 0 CHECK (tienda_pedido_minimo >= 0),
    tienda_requiere_caja_abierta boolean NOT NULL DEFAULT true,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cada negocio existente arranca con su sitio sin publicar
INSERT INTO public.negocios_sitio (id_negocio, nombre_publico)
SELECT id, nombre FROM public.negocios
ON CONFLICT (id_negocio) DO NOTHING;

-- Horario inicial: el de negocios.hora_apertura / hora_cierre, de lunes a sábado
INSERT INTO public.negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre)
SELECT n.id, d, n.hora_apertura, n.hora_cierre
FROM public.negocios n CROSS JOIN generate_series(1, 6) d
WHERE n.hora_apertura IS NOT NULL AND n.hora_cierre IS NOT NULL AND n.hora_apertura <> n.hora_cierre
  AND NOT EXISTS (SELECT 1 FROM public.negocios_horarios h WHERE h.id_negocio = n.id);

-- ---------------------------------------------------------------------
-- Punto Urbano (id 1): se carga con lo que hoy muestra puntourbano.co
-- (antes escrito en frontend/src/pages/PublicComponents/landing/siteConfig.ts)
-- ---------------------------------------------------------------------
UPDATE public.negocios SET
    url_negocio = 'punto-urbano',
    dominio = COALESCE(dominio, 'puntourbano.co'),
    whatsapp = COALESCE(whatsapp, '573226665512'),
    latitud = COALESCE(latitud, 1.223392),
    longitud = COALESCE(longitud, -77.286221),
    google_maps_url = COALESCE(google_maps_url, 'https://maps.app.goo.gl/ZxZo7wb9VQ38qcht6')
WHERE id = 1 AND NOT EXISTS (SELECT 1 FROM public.negocios x WHERE x.url_negocio = 'punto-urbano' AND x.id <> 1);

-- Horario publicado en la web: lunes a sábado de 7:00 a 16:00
DELETE FROM public.negocios_horarios WHERE id_negocio = 1;
INSERT INTO public.negocios_horarios (id_negocio, dia_semana, hora_apertura, hora_cierre)
SELECT 1, d, '07:00', '16:00' FROM generate_series(1, 6) d
WHERE EXISTS (SELECT 1 FROM public.negocios WHERE id = 1);

UPDATE public.negocios_sitio SET
    publicado = true,
    nombre_publico = 'Punto Urbano',
    eslogan = 'Restaurante de comidas rápidas, almuerzos y cenas en Pasto',
    frases = '["Restaurante en el corazón de Pasto", "Hamburguesas artesanales, carnes y experiencias únicas", "Buen ambiente, buena música y el mejor sabor", "Donde cada comida se convierte en experiencia"]',
    imagen_portada = '{"src": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=1800&q=70", "alt": "Hamburguesa con queso sobre una mesa de madera oscura"}',
    nosotros_titulo = 'Sabor de ciudad',
    nosotros_texto = 'En Punto Urbano combinamos hamburguesas artesanales, comida rápida premium y una experiencia moderna en el corazón de Pasto.',
    nosotros_items = '[
      {"titulo": "Comida urbana", "texto": "Sabores intensos con identidad local.", "foto": {"src": "https://images.unsplash.com/photo-1558030089-02acba3c214e?auto=format&fit=crop&w=1200&q=70", "alt": "Carne a la parrilla sobre las brasas"}},
      {"titulo": "Ambiente moderno", "texto": "Diseño pensado para una experiencia única.", "foto": {"src": "https://images.unsplash.com/photo-1772693471187-6e7d364f99ee?auto=format&fit=crop&w=1200&q=70", "alt": "Pollo a la plancha con arroz y vegetales"}},
      {"titulo": "Domicilios rápidos", "texto": "Llevamos el sabor hasta tu puerta.", "foto": {"src": "https://images.unsplash.com/photo-1691775755067-a9807ac8939c?auto=format&fit=crop&w=1200&q=70", "alt": "Taza de café recién servido"}}
    ]',
    imagen_franja = '{"src": "https://images.unsplash.com/photo-1708388464878-5df2d66b758e?auto=format&fit=crop&w=1800&q=70", "alt": "Parrilla encendida con comida"}',
    galeria = '[
      {"src": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=70", "alt": "Hamburguesa servida en tabla de madera", "forma": "ancha"},
      {"src": "https://images.unsplash.com/photo-1527598041828-aea5d622f3a8?auto=format&fit=crop&w=1200&q=70", "alt": "Desayuno con huevos y tocineta", "forma": "alta"},
      {"src": "https://images.unsplash.com/photo-1784902540562-9b048bde9ace?auto=format&fit=crop&w=1200&q=70", "alt": "Pollo a la parrilla con arroz y papas"},
      {"src": "https://images.unsplash.com/photo-1617319683252-027deeba5fd5?auto=format&fit=crop&w=1200&q=70", "alt": "Vaso de jugo de naranja"},
      {"src": "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=70", "alt": "Hamburguesa con papas a la francesa"},
      {"src": "https://images.unsplash.com/photo-1646908499080-e412060bcfe2?auto=format&fit=crop&w=1200&q=70", "alt": "Taza de café con granos sobre la mesa"},
      {"src": "https://images.unsplash.com/photo-1529262365544-55d1707e64e6?auto=format&fit=crop&w=1200&q=70", "alt": "Carne asándose en la parrilla", "forma": "ancha"},
      {"src": "https://images.unsplash.com/photo-1603532232030-69a8264a71f4?auto=format&fit=crop&w=1200&q=70", "alt": "Fruta picada junto a una taza de café"}
    ]',
    servicios = 'Domicilios · Reservas por teléfono',
    mensaje_whatsapp = 'Hola Punto Urbano, quiero hacer un pedido.',
    seo_titulo = 'Punto Urbano | Restaurante de Comidas Rápidas, Almuerzos y Cenas en Pasto',
    seo_descripcion = 'Punto Urbano en Pasto, Nariño. Restaurante de comidas rápidas, hamburguesas artesanales, almuerzos, cenas, fast food premium, domicilios y bebidas. Disfruta un ambiente moderno y el mejor sabor en Pasto.',
    tema = 'dark',
    mostrar_fotos_productos = false,
    tienda_activa = true
WHERE id_negocio = 1;
