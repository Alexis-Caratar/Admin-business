-- =====================================================================
-- ACTUALIZACIÓN DE LA BASE DE DATOS (producción)
-- Generado: 2026-10-20 con node scripts/armar-produccion.js (no editar a mano)
-- Migraciones: 001_tienda_pedidos, 002_sitio_negocios, 003_tipos_negocio, 004_inventario, 005_whatsapp, 006_ficha_producto, 007_integraciones, 008_impresion
--
-- Uso: sudo -u postgres psql -d adminbusiness -f actualizacion.sql
--
-- Todo va en UNA transacción: si algo falla, no se aplica nada.
-- =====================================================================
\set ON_ERROR_STOP on
\set QUIET on
SET client_min_messages = warning;
BEGIN;
CREATE TABLE IF NOT EXISTS public.schema_migraciones (
    nombre character varying(100) PRIMARY KEY,
    aplicada_en timestamp without time zone NOT NULL DEFAULT now()
);

-- ######################################################################
-- 001_tienda_pedidos (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '001_tienda_pedidos') AS pendiente,
       (to_regclass('public.pedidos') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 001_tienda_pedidos: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 001_tienda_pedidos'
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

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('001_tienda_pedidos');
\else
\echo '-- 001_tienda_pedidos: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 002_sitio_negocios (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '002_sitio_negocios') AS pendiente,
       (to_regclass('public.negocios_sitio') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 002_sitio_negocios: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 002_sitio_negocios'
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

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('002_sitio_negocios');
\else
\echo '-- 002_sitio_negocios: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 003_tipos_negocio (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '003_tipos_negocio') AS pendiente,
       (to_regclass('public.tipos_negocio') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 003_tipos_negocio: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 003_tipos_negocio'
-- =====================================================================
-- 003 · Tipos de negocio: el sitio web se adapta a cada tipo
-- Aplicar:  node scripts/migrar.js up 003_tipos_negocio
-- Revertir: node scripts/migrar.js down 003_tipos_negocio
-- =====================================================================
-- perfil (jsonb):
--   vista_catalogo  "carta" (lista, para comida) | "cuadricula" (tarjetas con foto)
--   schema          tipo de schema.org para Google (Restaurant, GroceryStore…)
--   iconos          íconos de la sección Nosotros
--   textos          vocabulario de la web y la tienda ("La carta"/"Nuestros productos"…)
--   sugeridos       contenido inicial del sitio al crear un negocio ({nombre}, {ciudad})
CREATE TABLE public.tipos_negocio (
    codigo character varying(40) PRIMARY KEY CHECK (codigo ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    nombre character varying(80) NOT NULL UNIQUE,
    orden integer NOT NULL DEFAULT 100,
    activo boolean NOT NULL DEFAULT true,
    perfil jsonb NOT NULL
);

INSERT INTO public.tipos_negocio (codigo, nombre, orden, perfil) VALUES
  ('restaurante', 'Restaurante', 1, '{"vista_catalogo": "carta", "schema": "Restaurant", "iconos": ["restaurante", "comida", "domicilio"], "textos": {"seccion_catalogo": "Menú", "titulo_catalogo": "La carta", "subtitulo_catalogo": "Precios y platos actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver el menú", "item": "plato", "items": "platos", "pedir_item": "Pedir este plato", "pedir_linea": "Pedir en línea", "pedir_corto": "Pedir", "tienda_titulo": "Pide en línea", "tienda_subtitulo": "Elige tus platos, págalos en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un plato", "a_elegir": "Incluye a elegir", "adiciones": "Adiciones", "carrito": "Tu pedido", "domicilio": "Domicilio", "recoger": "Recoger en el local", "preparacion": "En preparación", "aviso_preparacion": "Empezamos a preparar tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestro restaurante", "contacto_etiqueta": "Contacto y pedidos", "contacto_titulo": "¿Pedimos?", "contacto_texto": "Haz tu pedido a domicilio o reserva tu mesa. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Antojos", "catalogo_error": "No pudimos cargar la carta en este momento", "pedir_catalogo": "Pedir la carta", "pedir_catalogo_wa": "¿me comparten la carta de hoy?", "whatsapp_cta": "Pedir por WhatsApp", "sin_items": "Por ahora no hay platos disponibles para pedir en línea."}, "sugeridos": {"frases": ["Sabor que se disfruta en cada visita", "Ingredientes frescos y preparación al momento", "Pide a domicilio o visítanos"], "nosotros_titulo": "Hecho con sabor", "nosotros_texto": "En {nombre} preparamos cada plato al momento, con ingredientes frescos y la mejor atención.", "nosotros_items": [{"titulo": "Cocina fresca", "texto": "Preparamos cada pedido al momento."}, {"titulo": "Buen ambiente", "texto": "Un lugar cómodo para compartir."}, {"titulo": "Domicilios", "texto": "Llevamos tu pedido hasta tu puerta."}], "franja_texto": "Ven por el sabor, quédate por el ambiente", "servicios": "Domicilios · Pedidos en línea · Consumo en el local", "mensaje_whatsapp": "Hola {nombre}, quiero hacer un pedido.", "seo_titulo": "{nombre} | Restaurante en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira la carta, pide en línea o a domicilio."}}'),
  ('comida-rapida', 'Comida rápida', 2, '{"vista_catalogo": "carta", "schema": "FastFoodRestaurant", "iconos": ["restaurante", "comida", "domicilio"], "textos": {"seccion_catalogo": "Menú", "titulo_catalogo": "La carta", "subtitulo_catalogo": "Precios y platos actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver el menú", "item": "plato", "items": "platos", "pedir_item": "Pedir este plato", "pedir_linea": "Pedir en línea", "pedir_corto": "Pedir", "tienda_titulo": "Pide en línea", "tienda_subtitulo": "Elige tus platos, págalos en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un plato", "a_elegir": "Incluye a elegir", "adiciones": "Adiciones", "carrito": "Tu pedido", "domicilio": "Domicilio", "recoger": "Recoger en el local", "preparacion": "En preparación", "aviso_preparacion": "Empezamos a preparar tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestro local", "contacto_etiqueta": "Contacto y pedidos", "contacto_titulo": "¿Pedimos?", "contacto_texto": "Haz tu pedido a domicilio o reserva tu mesa. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Antojos", "catalogo_error": "No pudimos cargar la carta en este momento", "pedir_catalogo": "Pedir la carta", "pedir_catalogo_wa": "¿me comparten la carta de hoy?", "whatsapp_cta": "Pedir por WhatsApp", "sin_items": "Por ahora no hay platos disponibles para pedir en línea."}, "sugeridos": {"frases": ["Rápido, rico y a tu manera", "Hamburguesas, perros y más", "Pide en línea y recibe en casa"], "nosotros_titulo": "Hecho con sabor", "nosotros_texto": "En {nombre} preparamos cada plato al momento, con ingredientes frescos y la mejor atención.", "nosotros_items": [{"titulo": "Cocina fresca", "texto": "Preparamos cada pedido al momento."}, {"titulo": "Buen ambiente", "texto": "Un lugar cómodo para compartir."}, {"titulo": "Domicilios", "texto": "Llevamos tu pedido hasta tu puerta."}], "franja_texto": "Ven por el sabor, quédate por el ambiente", "servicios": "Domicilios · Pedidos en línea · Consumo en el local", "mensaje_whatsapp": "Hola {nombre}, quiero hacer un pedido.", "seo_titulo": "{nombre} | Comida rápida en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira la carta, pide en línea o a domicilio."}}'),
  ('cafeteria', 'Cafetería', 3, '{"vista_catalogo": "carta", "schema": "CafeOrCoffeeShop", "iconos": ["cafe", "comida", "domicilio"], "textos": {"seccion_catalogo": "Menú", "titulo_catalogo": "Nuestra carta", "subtitulo_catalogo": "Precios y platos actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver el menú", "item": "plato", "items": "platos", "pedir_item": "Pedir este plato", "pedir_linea": "Pedir en línea", "pedir_corto": "Pedir", "tienda_titulo": "Pide en línea", "tienda_subtitulo": "Elige tus platos, págalos en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un plato", "a_elegir": "Incluye a elegir", "adiciones": "Adiciones", "carrito": "Tu pedido", "domicilio": "Domicilio", "recoger": "Recoger en el local", "preparacion": "En preparación", "aviso_preparacion": "Empezamos a preparar tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra cafetería", "contacto_etiqueta": "Contacto y pedidos", "contacto_titulo": "¿Pedimos?", "contacto_texto": "Haz tu pedido o visítanos. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Momentos", "catalogo_error": "No pudimos cargar la carta en este momento", "pedir_catalogo": "Pedir la carta", "pedir_catalogo_wa": "¿me comparten la carta de hoy?", "whatsapp_cta": "Pedir por WhatsApp", "sin_items": "Por ahora no hay platos disponibles para pedir en línea."}, "sugeridos": {"frases": ["Café recién preparado", "Un lugar para conversar", "Desayunos, onces y más"], "nosotros_titulo": "Hecho con sabor", "nosotros_texto": "En {nombre} preparamos cada plato al momento, con ingredientes frescos y la mejor atención.", "nosotros_items": [{"titulo": "Cocina fresca", "texto": "Preparamos cada pedido al momento."}, {"titulo": "Buen ambiente", "texto": "Un lugar cómodo para compartir."}, {"titulo": "Domicilios", "texto": "Llevamos tu pedido hasta tu puerta."}], "franja_texto": "Una pausa con buen café", "servicios": "Domicilios · Pedidos en línea · Consumo en el local", "mensaje_whatsapp": "Hola {nombre}, quiero hacer un pedido.", "seo_titulo": "{nombre} | Cafetería en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira la carta, pide en línea o a domicilio."}}'),
  ('panaderia', 'Panadería', 4, '{"vista_catalogo": "cuadricula", "schema": "Bakery", "iconos": ["panaderia", "oferta", "domicilio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Nuestros productos", "subtitulo_catalogo": "Precios y platos actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver el menú", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Pedir en línea", "pedir_corto": "Pedir", "tienda_titulo": "Pide en línea", "tienda_subtitulo": "Elige tus platos, págalos en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Incluye a elegir", "adiciones": "Adiciones", "carrito": "Tu pedido", "domicilio": "Domicilio", "recoger": "Recoger en el local", "preparacion": "En preparación", "aviso_preparacion": "Empezamos a preparar tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra panadería", "contacto_etiqueta": "Contacto y pedidos", "contacto_titulo": "¿Pedimos?", "contacto_texto": "Haz tu pedido a domicilio o reserva tu mesa. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Recién horneado", "catalogo_error": "No pudimos cargar la carta en este momento", "pedir_catalogo": "Pedir la lista de productos", "pedir_catalogo_wa": "¿qué productos tienen hoy?", "whatsapp_cta": "Pedir por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para pedir en línea."}, "sugeridos": {"frases": ["Pan recién horneado todos los días", "Tortas y postres para cada ocasión", "Pide en línea y recoge o recibe en casa"], "nosotros_titulo": "Hecho con sabor", "nosotros_texto": "En {nombre} preparamos cada plato al momento, con ingredientes frescos y la mejor atención.", "nosotros_items": [{"titulo": "Cocina fresca", "texto": "Preparamos cada pedido al momento."}, {"titulo": "Buen ambiente", "texto": "Un lugar cómodo para compartir."}, {"titulo": "Domicilios", "texto": "Llevamos tu pedido hasta tu puerta."}], "franja_texto": "Recién salido del horno", "servicios": "Domicilios · Pedidos en línea · Consumo en el local", "mensaje_whatsapp": "Hola {nombre}, quiero hacer un pedido.", "seo_titulo": "{nombre} | Panadería en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira la carta, pide en línea o a domicilio."}}'),
  ('bar', 'Bar', 5, '{"vista_catalogo": "carta", "schema": "BarOrPub", "iconos": ["bar", "musica", "reserva"], "textos": {"seccion_catalogo": "Menú", "titulo_catalogo": "Nuestra carta", "subtitulo_catalogo": "Precios y platos actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver el menú", "item": "plato", "items": "platos", "pedir_item": "Pedir este plato", "pedir_linea": "Pedir en línea", "pedir_corto": "Pedir", "tienda_titulo": "Pide en línea", "tienda_subtitulo": "Elige tus platos, págalos en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un plato", "a_elegir": "Incluye a elegir", "adiciones": "Adiciones", "carrito": "Tu pedido", "domicilio": "Domicilio", "recoger": "Recoger en el local", "preparacion": "En preparación", "aviso_preparacion": "Empezamos a preparar tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestro bar", "contacto_etiqueta": "Contacto y pedidos", "contacto_titulo": "¿Reservamos?", "contacto_texto": "Reserva tu mesa o haz tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Noches", "catalogo_error": "No pudimos cargar la carta en este momento", "pedir_catalogo": "Pedir la carta", "pedir_catalogo_wa": "¿me comparten la carta de hoy?", "whatsapp_cta": "Pedir por WhatsApp", "sin_items": "Por ahora no hay platos disponibles para pedir en línea."}, "sugeridos": {"frases": ["Buena música y mejor compañía", "Cócteles y bebidas para cada gusto", "Reserva tu mesa"], "nosotros_titulo": "Hecho con sabor", "nosotros_texto": "En {nombre} preparamos cada plato al momento, con ingredientes frescos y la mejor atención.", "nosotros_items": [{"titulo": "Cocina fresca", "texto": "Preparamos cada pedido al momento."}, {"titulo": "Buen ambiente", "texto": "Un lugar cómodo para compartir."}, {"titulo": "Domicilios", "texto": "Llevamos tu pedido hasta tu puerta."}], "franja_texto": "La noche empieza aquí", "servicios": "Domicilios · Pedidos en línea · Consumo en el local", "mensaje_whatsapp": "Hola {nombre}, quiero hacer un pedido.", "seo_titulo": "{nombre} | Bar en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira la carta, pide en línea o a domicilio."}}'),
  ('supermercado', 'Supermercado', 6, '{"vista_catalogo": "cuadricula", "schema": "GroceryStore", "iconos": ["mercado", "oferta", "envio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Haz tu mercado", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver el mercado", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Haz tu mercado en línea", "tienda_subtitulo": "Agrega tus productos al carrito, paga en línea o al recibir, y sigue tu pedido en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Complementos", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestro supermercado", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Escríbenos para consultar disponibilidad, precios o hacer tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Frescura y variedad", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Tu mercado completo en un solo lugar", "Frutas, verduras y abarrotes frescos", "Haz tu mercado en línea y recíbelo en casa"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Productos frescos", "texto": "Frutas, verduras y carnes todos los días."}, {"titulo": "Ofertas", "texto": "Precios bajos en lo que más compras."}, {"titulo": "Domicilios", "texto": "Tu mercado hasta la puerta de tu casa."}], "franja_texto": "Frescura y ahorro para tu hogar", "servicios": "Envíos a domicilio · Compras en línea · Atención en tienda", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Supermercado en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('tienda', 'Tienda', 7, '{"vista_catalogo": "cuadricula", "schema": "Store", "iconos": ["tienda", "oferta", "envio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Nuestros productos", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver productos", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Complementos", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra tienda", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Escríbenos para consultar disponibilidad, precios o hacer tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Galería", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Todo lo que necesitas en un solo lugar", "Precios justos y atención cercana", "Compra en línea y recibe en casa"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Variedad", "texto": "Productos para cada necesidad."}, {"titulo": "Buenos precios", "texto": "Ofertas y precios justos todos los días."}, {"titulo": "Envíos", "texto": "Llevamos tu compra hasta tu puerta."}], "franja_texto": "Calidad y buenos precios todos los días", "servicios": "Envíos a domicilio · Compras en línea · Atención en tienda", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Tienda en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('tecnologia', 'Tecnología', 8, '{"vista_catalogo": "cuadricula", "schema": "ElectronicsStore", "iconos": ["tecnologia", "garantia", "envio"], "textos": {"seccion_catalogo": "Catálogo", "titulo_catalogo": "Catálogo", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver catálogo", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Accesorios", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra tienda", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Consulta disponibilidad, garantías o soporte técnico. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Nuestra tienda", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Tecnología original con garantía", "Celulares, computadores y accesorios", "Asesoría experta antes y después de tu compra"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Productos originales", "texto": "Marcas reconocidas con garantía."}, {"titulo": "Soporte técnico", "texto": "Te acompañamos después de la compra."}, {"titulo": "Envíos seguros", "texto": "Tu pedido protegido hasta tu puerta."}], "franja_texto": "La tecnología que necesitas, con respaldo", "servicios": "Garantía · Soporte técnico · Envíos a domicilio", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Tecnología en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('ropa', 'Ropa y moda', 9, '{"vista_catalogo": "cuadricula", "schema": "ClothingStore", "iconos": ["ropa", "calidad", "envio"], "textos": {"seccion_catalogo": "Colección", "titulo_catalogo": "Colección", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver la colección", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Opciones", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra marca", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Escríbenos para consultar disponibilidad, precios o hacer tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Lookbook", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Estilo para cada ocasión", "Nuevas colecciones cada temporada", "Compra en línea y recibe en casa"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Diseño", "texto": "Prendas pensadas para ti."}, {"titulo": "Calidad", "texto": "Materiales que duran."}, {"titulo": "Envíos", "texto": "Cambios fáciles y envío a domicilio."}], "franja_texto": "Viste tu estilo", "servicios": "Envíos a domicilio · Cambios · Compras en línea", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Ropa y moda en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('farmacia', 'Farmacia y droguería', 10, '{"vista_catalogo": "cuadricula", "schema": "Pharmacy", "iconos": ["salud", "calidad", "envio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Nuestros productos", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver productos", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Complementos", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra droguería", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Consulta disponibilidad de medicamentos y productos. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Nuestra droguería", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Tu salud en buenas manos", "Medicamentos y cuidado personal", "Domicilios rápidos"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Atención farmacéutica", "texto": "Te orientamos con responsabilidad."}, {"titulo": "Variedad", "texto": "Medicamentos, cuidado personal y bebé."}, {"titulo": "Domicilios", "texto": "Rápidos y seguros."}], "franja_texto": "Cuidamos de ti y de tu familia", "servicios": "Domicilios · Atención farmacéutica", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Droguería en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('ferreteria', 'Ferretería', 11, '{"vista_catalogo": "cuadricula", "schema": "HardwareStore", "iconos": ["herramienta", "calidad", "envio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Nuestros productos", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver productos", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Accesorios", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nuestra ferretería", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Escríbenos para consultar disponibilidad, precios o hacer tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Nuestra ferretería", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Herramientas y materiales para tu obra", "Asesoría para cada proyecto", "Envíos a domicilio"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Variedad", "texto": "Herramientas, eléctricos, pinturas y más."}, {"titulo": "Asesoría", "texto": "Te ayudamos a elegir lo que necesitas."}, {"titulo": "Envíos", "texto": "Llevamos tus materiales a la obra."}], "franja_texto": "Todo para construir y reparar", "servicios": "Envíos a domicilio · Compras en línea · Atención en tienda", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | Ferretería en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}'),
  ('belleza', 'Belleza y cuidado personal', 12, '{"vista_catalogo": "cuadricula", "schema": "BeautySalon", "iconos": ["belleza", "calidad", "agenda"], "textos": {"seccion_catalogo": "Servicios", "titulo_catalogo": "Nuestros servicios", "subtitulo_catalogo": "Servicios y precios actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver servicios", "item": "servicio", "items": "servicios", "pedir_item": "Solicitar este servicio", "pedir_linea": "Solicitar en línea", "pedir_corto": "Solicitar", "tienda_titulo": "Solicita en línea", "tienda_subtitulo": "Elige el servicio, paga en línea o en el lugar, y sigue tu solicitud en tiempo real.", "buscar": "Buscar un servicio", "a_elegir": "Elige una opción", "adiciones": "Adicionales", "carrito": "Tu solicitud", "domicilio": "A domicilio", "recoger": "En el establecimiento", "preparacion": "En proceso", "aviso_preparacion": "Empezamos tu solicitud cuando se confirma el pago.", "nosotros_etiqueta": "Nuestro salón", "contacto_etiqueta": "Contacto y citas", "contacto_titulo": "¿Agendamos?", "contacto_texto": "Escríbenos para agendar o resolver tus dudas. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Nuestro trabajo", "catalogo_error": "No pudimos cargar los servicios en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten la lista de servicios?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay servicios disponibles en línea."}, "sugeridos": {"frases": ["Tu mejor versión empieza aquí", "Profesionales en belleza y cuidado", "Agenda tu cita"], "nosotros_titulo": "A tu servicio", "nosotros_texto": "En {nombre} trabajamos con calidad, puntualidad y atención personalizada.", "nosotros_items": [{"titulo": "Experiencia", "texto": "Personal capacitado y comprometido."}, {"titulo": "Calidad", "texto": "Resultados que hablan por nosotros."}, {"titulo": "Puntualidad", "texto": "Cumplimos lo que acordamos."}], "franja_texto": "Belleza que se nota", "servicios": "Citas · Atención personalizada", "mensaje_whatsapp": "Hola {nombre}, quiero solicitar un servicio.", "seo_titulo": "{nombre} | Belleza en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Conoce nuestros servicios y agenda en línea."}}'),
  ('servicios', 'Servicios', 13, '{"vista_catalogo": "cuadricula", "schema": "LocalBusiness", "iconos": ["servicio", "calidad", "agenda"], "textos": {"seccion_catalogo": "Servicios", "titulo_catalogo": "Nuestros servicios", "subtitulo_catalogo": "Servicios y precios actualizados directamente desde nuestro sistema.", "ver_catalogo": "Ver servicios", "item": "servicio", "items": "servicios", "pedir_item": "Solicitar este servicio", "pedir_linea": "Solicitar en línea", "pedir_corto": "Solicitar", "tienda_titulo": "Solicita en línea", "tienda_subtitulo": "Elige el servicio, paga en línea o en el lugar, y sigue tu solicitud en tiempo real.", "buscar": "Buscar un servicio", "a_elegir": "Elige una opción", "adiciones": "Adicionales", "carrito": "Tu solicitud", "domicilio": "A domicilio", "recoger": "En el establecimiento", "preparacion": "En proceso", "aviso_preparacion": "Empezamos tu solicitud cuando se confirma el pago.", "nosotros_etiqueta": "Quiénes somos", "contacto_etiqueta": "Contacto y citas", "contacto_titulo": "¿Agendamos?", "contacto_texto": "Escríbenos para agendar o resolver tus dudas. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Nuestro trabajo", "catalogo_error": "No pudimos cargar los servicios en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten la lista de servicios?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay servicios disponibles en línea."}, "sugeridos": {"frases": ["Profesionales a tu servicio", "Calidad y cumplimiento en cada trabajo", "Agenda en línea o por WhatsApp"], "nosotros_titulo": "A tu servicio", "nosotros_texto": "En {nombre} trabajamos con calidad, puntualidad y atención personalizada.", "nosotros_items": [{"titulo": "Experiencia", "texto": "Personal capacitado y comprometido."}, {"titulo": "Calidad", "texto": "Resultados que hablan por nosotros."}, {"titulo": "Puntualidad", "texto": "Cumplimos lo que acordamos."}], "franja_texto": "Hacemos las cosas bien desde el primer día", "servicios": "Atención personalizada · Citas por WhatsApp", "mensaje_whatsapp": "Hola {nombre}, quiero solicitar un servicio.", "seo_titulo": "{nombre} | Servicios en {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Conoce nuestros servicios y agenda en línea."}}'),
  ('otros', 'Otros', 14, '{"vista_catalogo": "cuadricula", "schema": "LocalBusiness", "iconos": ["tienda", "oferta", "envio"], "textos": {"seccion_catalogo": "Productos", "titulo_catalogo": "Nuestros productos", "subtitulo_catalogo": "Precios y disponibilidad actualizados directamente desde nuestro inventario.", "ver_catalogo": "Ver productos", "item": "producto", "items": "productos", "pedir_item": "Pedir este producto", "pedir_linea": "Comprar en línea", "pedir_corto": "Comprar", "tienda_titulo": "Compra en línea", "tienda_subtitulo": "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.", "buscar": "Buscar un producto", "a_elegir": "Elige una opción", "adiciones": "Complementos", "carrito": "Tu carrito", "domicilio": "Envío a domicilio", "recoger": "Recoger en la tienda", "preparacion": "Alistando tu pedido", "aviso_preparacion": "Alistamos tu pedido cuando se confirma el pago.", "nosotros_etiqueta": "Nosotros", "contacto_etiqueta": "Contacto", "contacto_titulo": "¿Te ayudamos?", "contacto_texto": "Escríbenos para consultar disponibilidad, precios o hacer tu pedido. Te respondemos por WhatsApp o por teléfono.", "galeria_titulo": "Galería", "catalogo_error": "No pudimos cargar los productos en este momento", "pedir_catalogo": "Pedir información", "pedir_catalogo_wa": "¿me comparten el catálogo de productos?", "whatsapp_cta": "Escríbenos por WhatsApp", "sin_items": "Por ahora no hay productos disponibles para comprar en línea."}, "sugeridos": {"frases": ["Todo lo que necesitas en un solo lugar", "Precios justos y atención cercana", "Compra en línea y recibe en casa"], "nosotros_titulo": "Cerca de ti", "nosotros_texto": "En {nombre} encuentras productos de calidad, buenos precios y una atención cercana.", "nosotros_items": [{"titulo": "Variedad", "texto": "Productos para cada necesidad."}, {"titulo": "Buenos precios", "texto": "Ofertas y precios justos todos los días."}, {"titulo": "Envíos", "texto": "Llevamos tu compra hasta tu puerta."}], "franja_texto": "Calidad y buenos precios todos los días", "servicios": "Envíos a domicilio · Compras en línea · Atención en tienda", "mensaje_whatsapp": "Hola {nombre}, quiero hacer una compra.", "seo_titulo": "{nombre} | {ciudad}", "seo_descripcion": "{nombre} en {ciudad}. Mira nuestros productos y compra en línea con envío a domicilio."}}');

-- El tipo de cada negocio pasa a apuntar a esta tabla
ALTER TABLE public.negocios ADD COLUMN tipo_negocio character varying(40) REFERENCES public.tipos_negocio(codigo);
UPDATE public.negocios n SET tipo_negocio = COALESCE(
    (SELECT t.codigo FROM public.tipos_negocio t
     WHERE lower(t.nombre) = lower(trim(n.tipo)) OR t.codigo = lower(trim(n.tipo))
        OR (lower(trim(n.tipo)) = 'comida rápidas' AND t.codigo = 'comida-rapida')
     LIMIT 1),
    'otros');
UPDATE public.negocios n SET tipo = t.nombre FROM public.tipos_negocio t WHERE t.codigo = n.tipo_negocio;
ALTER TABLE public.negocios ALTER COLUMN tipo_negocio SET DEFAULT 'otros', ALTER COLUMN tipo_negocio SET NOT NULL;

-- Texto grande de la franja de foto (antes fijo en el código)
ALTER TABLE public.negocios_sitio ADD COLUMN franja_texto character varying(160);
UPDATE public.negocios_sitio SET franja_texto = 'Buen ambiente, buena música y el mejor sabor' WHERE id_negocio = 1;

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('003_tipos_negocio');
\else
\echo '-- 003_tipos_negocio: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 004_inventario (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '004_inventario') AS pendiente,
       (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_caja' AND column_name = 'stock_apertura' AND data_type = 'numeric')) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 004_inventario: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 004_inventario'
-- =====================================================================
-- 004 · Inventario: descuento atómico, mensajes claros y decimales
-- Aplicar:  node scripts/migrar.js up 004_inventario
-- Revertir: node scripts/migrar.js down 004_inventario
-- No modifica stock ni productos existentes.
-- =====================================================================

-- Un producto nuevo no "usa receta" salvo que se configure (antes el valor
-- por defecto era true y dejaba productos que fallaban al venderse).
ALTER TABLE public.productos ALTER COLUMN usa_receta SET DEFAULT false;

-- Conteos de caja con decimales (insumos por kilo, litro…)
ALTER TABLE public.inventario_caja
    ALTER COLUMN stock_apertura TYPE numeric(12,2),
    ALTER COLUMN stock_cierre TYPE numeric(12,2),
    ALTER COLUMN stock_sistema TYPE numeric(12,2),
    ALTER COLUMN diferencia TYPE numeric(12,2);

-- ---------------------------------------------------------------------
-- Descuento al vender. Cambios frente a la versión anterior:
--  * El descuento es atómico (UPDATE … WHERE stock_actual >= cantidad):
--    dos ventas simultáneas ya no pueden dejar el stock en negativo.
--  * Los mensajes dicen el nombre del producto o insumo, no su id.
--  * Mismo comportamiento: misma validación, mismos movimientos 'VENTA'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.descontar_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  r RECORD;
  v_usa_receta BOOLEAN;
  v_inventario_id INT;
  v_controla_inventario BOOLEAN;
  v_nombre_producto TEXT;
  v_id_caja INT;
  v_nombre TEXT;
  v_stock NUMERIC;
BEGIN
  SELECT id_caja INTO v_id_caja FROM ventas WHERE id = NEW.id_venta;

  SELECT usa_receta, inventario_id, controla_inventario, nombre
  INTO v_usa_receta, v_inventario_id, v_controla_inventario, v_nombre_producto
  FROM productos WHERE id = NEW.id_producto;

  IF v_controla_inventario IS NULL THEN
    RAISE EXCEPTION 'El producto % no existe o no está configurado', NEW.id_producto;
  END IF;

  IF v_controla_inventario = FALSE THEN
    RETURN NEW;
  END IF;

  IF v_usa_receta = TRUE THEN
    IF NOT EXISTS (SELECT 1 FROM recetas WHERE producto_id = NEW.id_producto) THEN
      RAISE EXCEPTION '"%" está configurado con receta pero no tiene insumos. Configura la receta o cambia el modo de control.', v_nombre_producto;
    END IF;

    FOR r IN SELECT inventario_id, cantidad FROM recetas WHERE producto_id = NEW.id_producto LOOP
      UPDATE inventario
      SET stock_actual = stock_actual - (r.cantidad * NEW.cantidad)
      WHERE id = r.inventario_id AND stock_actual >= (r.cantidad * NEW.cantidad);

      IF NOT FOUND THEN
        SELECT nombre, stock_actual INTO v_nombre, v_stock FROM inventario WHERE id = r.inventario_id;
        RAISE EXCEPTION 'Stock insuficiente de "%" para "%" (disponible: %, requerido: %)',
          v_nombre, v_nombre_producto, v_stock, r.cantidad * NEW.cantidad;
      END IF;

      INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
      VALUES (r.inventario_id, v_id_caja, NEW.id_venta, 'VENTA', r.cantidad * NEW.cantidad, NOW());
    END LOOP;

  ELSE
    IF v_inventario_id IS NULL THEN
      RAISE EXCEPTION '"%" controla inventario pero no tiene un ítem de inventario asociado.', v_nombre_producto;
    END IF;

    UPDATE inventario
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = v_inventario_id AND stock_actual >= NEW.cantidad;

    IF NOT FOUND THEN
      SELECT nombre, stock_actual INTO v_nombre, v_stock FROM inventario WHERE id = v_inventario_id;
      RAISE EXCEPTION 'Stock insuficiente de "%" (disponible: %, requerido: %)', v_nombre, v_stock, NEW.cantidad;
    END IF;

    INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
    VALUES (v_inventario_id, v_id_caja, NEW.id_venta, 'VENTA', NEW.cantidad, NOW());
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- Devolución al cancelar. Cambio: devuelve exactamente lo que se
-- descontó en esa venta (sus movimientos 'VENTA'), no lo que diga hoy la
-- configuración del producto. Si alguien cambió la receta o el
-- inventario asociado después de vender, antes se devolvía a otro ítem.
-- Ventas antiguas sin movimientos (antes del trigger) no devuelven nada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.devolver_inventario_cancelacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  m RECORD;
BEGIN
  IF OLD.estado <> 'activa' OR NEW.estado <> 'cancelado' THEN
    RETURN NEW;
  END IF;

  IF NEW.id_mesa IS NOT NULL THEN
    UPDATE mesas SET estado = 'Disponible' WHERE id = NEW.id_mesa AND estado = 'Ocupada';
  END IF;

  FOR m IN
    SELECT inventario_id, SUM(cantidad) AS cantidad
    FROM inventario_movimientos
    WHERE id_venta = NEW.id AND tipo = 'VENTA'
    GROUP BY inventario_id
  LOOP
    UPDATE inventario SET stock_actual = stock_actual + m.cantidad WHERE id = m.inventario_id;

    INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
    VALUES (m.inventario_id, NEW.id_caja, NEW.id, 'ANULACION', m.cantidad, NOW());
  END LOOP;

  RETURN NEW;
END;
$function$;

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('004_inventario');
\else
\echo '-- 004_inventario: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 005_whatsapp (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '005_whatsapp') AS pendiente,
       (to_regclass('public.notificaciones_whatsapp') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 005_whatsapp: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 005_whatsapp'
-- =====================================================================
-- 005 · Avisos por WhatsApp del estado de los pedidos web
-- Aplicar:  node scripts/migrar.js up 005_whatsapp
-- Revertir: node scripts/migrar.js down 005_whatsapp
-- =====================================================================

-- El cliente acepta (en el checkout) recibir avisos por WhatsApp
ALTER TABLE public.pedidos ADD COLUMN avisos_whatsapp boolean NOT NULL DEFAULT false;

-- Cola de mensajes: se guarda antes de enviar, se reintenta si falla y
-- nunca se envía dos veces el mismo aviso del mismo pedido.
CREATE TABLE public.notificaciones_whatsapp (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido bigint NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    evento character varying(20) NOT NULL
        CHECK (evento IN ('RECIBIDO', 'CONFIRMADO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO')),
    telefono character varying(20) NOT NULL,
    plantilla character varying(60) NOT NULL,
    parametros jsonb NOT NULL DEFAULT '[]',
    estado character varying(12) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'ERROR')),
    intentos smallint NOT NULL DEFAULT 0,
    id_mensaje character varying(120),
    error character varying(500),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    enviado_at timestamp with time zone,
    UNIQUE (id_pedido, evento)
);
CREATE INDEX idx_notif_whatsapp_pendientes ON public.notificaciones_whatsapp (estado, created_at) WHERE estado = 'PENDIENTE';

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('005_whatsapp');
\else
\echo '-- 005_whatsapp: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 006_ficha_producto (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '006_ficha_producto') AS pendiente,
       (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productos' AND column_name = 'marca')) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 006_ficha_producto: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 006_ficha_producto'
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

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('006_ficha_producto');
\else
\echo '-- 006_ficha_producto: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 007_integraciones (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '007_integraciones') AS pendiente,
       (to_regclass('public.negocios_integraciones') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 007_integraciones: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 007_integraciones'
-- =====================================================================
-- 007 · Integraciones por negocio (Wompi, WhatsApp y ajustes de la tienda)
-- Aplicar:  node scripts/migrar.js up 007_integraciones
-- Revertir: node scripts/migrar.js down 007_integraciones
-- Lo que se deja vacío se toma del .env del servidor (como hasta ahora).
-- Las columnas *_cifrado guardan secretos cifrados con AES-256-GCM
-- (clave CONFIG_SECRET del .env); nunca se guardan en texto plano.
-- =====================================================================
CREATE TABLE public.negocios_integraciones (
    id_negocio integer PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
    -- Wompi
    wompi_entorno character varying(12) NOT NULL DEFAULT 'pruebas' CHECK (wompi_entorno IN ('pruebas', 'produccion')),
    wompi_public_key character varying(120),
    wompi_integrity_cifrado text,
    wompi_events_cifrado text,
    wompi_private_cifrado text,
    -- WhatsApp Cloud API (Meta)
    whatsapp_token_cifrado text,
    whatsapp_phone_number_id character varying(40),
    whatsapp_api_version character varying(10),
    whatsapp_idioma character varying(10),
    -- Tienda
    tienda_url_retorno character varying(255),
    tienda_validar_horario boolean NOT NULL DEFAULT true,
    actualizado_por integer,
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.negocios_integraciones IS 'Credenciales y ajustes de pasarela/WhatsApp por negocio. Secretos cifrados.';

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('007_integraciones');
\else
\echo '-- 007_integraciones: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 008_impresion (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '008_impresion') AS pendiente,
       (to_regclass('public.negocios_impresion') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 008_impresion: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 008_impresion'
-- =====================================================================
-- 008 · Impresión por negocio (facturas, comandas y pedidos)
-- Aplicar:  node scripts/migrar.js up 008_impresion
-- Revertir: node scripts/migrar.js down 008_impresion
-- Todo lo que antes estaba fijo en el agente local (ancho, textos, QR,
-- documento de consumidor final, impresoras) se configura aquí por negocio.
-- agente_version: al generar un token nuevo sube y los anteriores dejan de servir.
-- =====================================================================
CREATE TABLE public.negocios_impresion (
    id_negocio integer PRIMARY KEY REFERENCES public.negocios(id) ON DELETE CASCADE,
    ancho_caracteres smallint NOT NULL DEFAULT 32 CHECK (ancho_caracteres IN (32, 42, 48)),
    encabezado text,                                   -- líneas extra bajo los datos del negocio
    pie text NOT NULL DEFAULT E'¡Gracias por tu compra!\nVuelve pronto',
    mostrar_qr boolean NOT NULL DEFAULT true,
    qr_contenido character varying(10) NOT NULL DEFAULT 'tienda' CHECK (qr_contenido IN ('tienda', 'factura', 'texto')),
    qr_texto character varying(300),
    qr_leyenda character varying(80) DEFAULT 'Escanea y visita nuestra tienda',
    documento_consumidor character varying(20) NOT NULL DEFAULT '222222222222',
    imprimir_comanda_al_vender boolean NOT NULL DEFAULT true,
    copias_comanda smallint NOT NULL DEFAULT 1 CHECK (copias_comanda BETWEEN 1 AND 5),
    agente_version integer NOT NULL DEFAULT 1,
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.negocios_impresion IS 'Formato de tickets y control del agente local de impresión por negocio.';

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('008_impresion');
\else
\echo '-- 008_impresion: ya estaba aplicada, se omite'
\endif

COMMIT;
\echo '== Actualización terminada. Migraciones aplicadas:'
\set QUIET off
SELECT nombre, aplicada_en FROM public.schema_migraciones ORDER BY nombre;
