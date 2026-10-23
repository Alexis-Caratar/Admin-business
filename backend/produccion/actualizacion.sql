-- =====================================================================
-- ACTUALIZACIÓN DE LA BASE DE DATOS (producción)
-- Generado: 2026-10-22 con node scripts/armar-produccion.js (no editar a mano)
-- Migraciones: 001_tienda_pedidos, 002_sitio_negocios, 003_tipos_negocio, 004_inventario, 005_whatsapp, 006_ficha_producto, 007_integraciones, 008_impresion, 009_finanzas, 010_finanzas_en_ventas, 011_tiqueteras, 012_meseros_comandas, 013_pago_dividido, 014_configuracion, 015_factura_al_cobrar, 016_publicidad
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

-- ######################################################################
-- 009_finanzas (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '009_finanzas') AS pendiente,
       (to_regclass('public.fin_gastos') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 009_finanzas: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 009_finanzas'
-- =====================================================================
-- 009 · Gestión financiera: costos fijos y variables, servicios, recurrentes,
--       pagos, presupuestos, alertas, auditoría y costo histórico.
-- Aplicar:  node scripts/migrar.js up 009_finanzas
-- Revertir: node scripts/migrar.js down 009_finanzas
-- Solo agrega tablas y columnas. Las ventas existentes reciben un costo
-- ESTIMADO (con los costos actuales) marcado como tal.
-- Diseño: docs/GESTION_FINANCIERA_DISENO.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- Módulo del menú (se activa por negocio en Admin > Negocios > módulos)
-- ---------------------------------------------------------------------
INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema)
SELECT 'finanzas', 'Finanzas', 'AccountBalanceIcon', 12, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'finanzas');

-- ---------------------------------------------------------------------
-- Categorías de costos y gastos. id_negocio NULL = del sistema (para todos).
-- grupo: FIJO · VARIABLE · SERVICIO · FUNCIONAMIENTO · NOMINA · NO_OPERATIVO
-- NO_OPERATIVO (movimientos de base, retiros, préstamos) nunca cuenta como gasto.
-- palabras: para sugerir la categoría de un egreso de caja por su descripción.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_categorias (
    id serial PRIMARY KEY,
    id_negocio integer REFERENCES public.negocios(id) ON DELETE CASCADE,
    codigo character varying(40) NOT NULL,
    nombre character varying(80) NOT NULL,
    grupo character varying(20) NOT NULL CHECK (grupo IN ('FIJO', 'VARIABLE', 'SERVICIO', 'FUNCIONAMIENTO', 'NOMINA', 'NO_OPERATIVO')),
    palabras text[] NOT NULL DEFAULT '{}',
    orden smallint NOT NULL DEFAULT 100,
    activo boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX uq_fin_categorias ON public.fin_categorias (COALESCE(id_negocio, 0), codigo);

INSERT INTO public.fin_categorias (codigo, nombre, grupo, palabras, orden) VALUES
  ('arriendo', 'Arriendo del local', 'FIJO', '{arriendo,alquiler,canon}', 10),
  ('nomina', 'Nómina y salarios', 'NOMINA', '{nomina,nómina,salario,sueldo,quincena,pago de personal,personal}', 11),
  ('seguridad_social', 'Seguridad social y prestaciones', 'NOMINA', '{seguridad social,eps,pension,pensión,arl,caja de compensacion,prima,cesantias,cesantías,vacaciones,liquidacion,liquidación}', 12),
  ('software', 'Software, licencias y suscripciones', 'FIJO', '{software,licencia,suscripcion,suscripción,hosting,dominio,aws}', 13),
  ('seguros', 'Seguros', 'FIJO', '{seguro,poliza,póliza}', 14),
  ('servicios_contratados', 'Servicios contratados', 'FIJO', '{servicio contratado,outsourcing,vigilancia}', 15),
  ('mantenimiento_periodico', 'Mantenimiento periódico', 'FIJO', '{mantenimiento mensual,mantenimiento periodico}', 16),
  ('honorarios', 'Honorarios contables y profesionales', 'FIJO', '{contador,contadora,honorarios,asesoria,asesoría}', 17),
  ('admin_otros', 'Otros gastos administrativos', 'FIJO', '{papeleria,papelería,administrativo}', 19),
  ('materia_prima', 'Materias primas e ingredientes', 'VARIABLE', '{leche,huevo,huevos,arroz,harina,azucar,azúcar,queso,pan,cafe,café,mercado,fritos,arepa,arepas,frijol,lenteja,papa,platano,plátano,maiz,maíz,mantequilla,chocolate}', 30),
  ('carnes', 'Carnes, pollo y pescado', 'VARIABLE', '{pollo,carne,res,cerdo,pescado,chorizo,salchicha,costilla,chicharron,chicharrón}', 31),
  ('verduras', 'Verduras y frutas', 'VARIABLE', '{verdura,verduras,fruta,frutas,tomate,cebolla,cilantro,aguacate,limon,limón,naranja,lulo,mora}', 32),
  ('aceites_condimentos', 'Aceites, condimentos y preparación', 'VARIABLE', '{aceite,sal,condimento,salsa,especias,vinagre,margarina}', 33),
  ('empaques', 'Empaques y desechables', 'VARIABLE', '{empaque,icopor,bolsa,bolsas,servilleta,servilletas,desechable,desechables,vaso,vasos,domicilio caja,papel aluminio,vinipel}', 34),
  ('bebidas', 'Bebidas para la venta', 'VARIABLE', '{gaseosa,gaseosas,coca,cocacola,agua en botella,jugo hit,cerveza,postobon,postobón}', 35),
  ('comisiones', 'Comisiones de plataformas y medios de pago', 'VARIABLE', '{comision,comisión,datafono,datáfono,rappi,wompi}', 36),
  ('transporte', 'Transporte y domicilios', 'VARIABLE', '{transporte,taxi,domiciliario,flete,gasolina,mototaxi}', 37),
  ('mermas', 'Mermas y desperdicios', 'VARIABLE', '{merma,desperdicio,daño,dañado,vencido}', 38),
  ('energia', 'Energía eléctrica', 'SERVICIO', '{luz,energia,energía,cedenar}', 50),
  ('agua', 'Agua y alcantarillado', 'SERVICIO', '{agua,acueducto,alcantarillado,empopasto}', 51),
  ('gas', 'Gas', 'SERVICIO', '{gas,pipeta,cilindro}', 52),
  ('internet', 'Internet', 'SERVICIO', '{internet,wifi,fibra}', 53),
  ('telefonia', 'Telefonía', 'SERVICIO', '{telefono,teléfono,celular,recarga,plan movil,plan móvil}', 54),
  ('residuos', 'Recolección de residuos', 'SERVICIO', '{basura,aseo,residuos,emas}', 55),
  ('mantenimiento_equipos', 'Mantenimiento de equipos', 'FUNCIONAMIENTO', '{mantenimiento,tecnico,técnico,nevera,estufa,horno,freidora}', 70),
  ('reparaciones', 'Reparaciones', 'FUNCIONAMIENTO', '{reparacion,reparación,arreglo,repuesto}', 71),
  ('limpieza', 'Limpieza y desinfección', 'FUNCIONAMIENTO', '{limpieza,jabon,jabón,cloro,detergente,desinfectante,escoba,trapero}', 72),
  ('plagas', 'Control de plagas', 'FUNCIONAMIENTO', '{fumigacion,fumigación,plagas}', 73),
  ('funcionamiento_otros', 'Otros gastos de funcionamiento', 'FUNCIONAMIENTO', '{}', 79),
  ('base_caja', 'Movimiento de base o traslado entre cajas', 'NO_OPERATIVO', '{base,aumento de base,traslado,cambio,sencillo,consignacion,consignación}', 90),
  ('retiro_socios', 'Retiros de los dueños', 'NO_OPERATIVO', '{retiro,socio,dueño,dueno}', 91),
  ('prestamos', 'Préstamos y abonos a créditos', 'NO_OPERATIVO', '{prestamo,préstamo,credito,crédito,abono,cuota}', 92);

-- ---------------------------------------------------------------------
-- Gastos recurrentes (plantillas). Se proyectan sin crear registros;
-- cada período se "causa" una sola vez (UNIQUE en fin_gastos).
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_recurrentes (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_categoria integer NOT NULL REFERENCES public.fin_categorias(id),
    concepto character varying(120) NOT NULL,
    valor_estimado numeric(14,2) NOT NULL CHECK (valor_estimado >= 0),
    periodicidad character varying(12) NOT NULL CHECK (periodicidad IN ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
    dia_vencimiento smallint NOT NULL DEFAULT 5 CHECK (dia_vencimiento BETWEEN 1 AND 28),
    fecha_inicio date NOT NULL,
    fecha_fin date CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    id_proveedor integer REFERENCES public.personas(id) ON DELETE SET NULL,
    beneficiario character varying(120),
    observacion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_recurrentes_negocio ON public.fin_recurrentes (id_negocio) WHERE activo;

-- ---------------------------------------------------------------------
-- Gastos causados (obligaciones): fijos, servicios, variables y nómina.
-- periodo = primer día del mes al que corresponde el gasto.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_gastos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_categoria integer NOT NULL REFERENCES public.fin_categorias(id),
    id_recurrente integer REFERENCES public.fin_recurrentes(id) ON DELETE SET NULL,
    concepto character varying(160) NOT NULL,
    valor numeric(14,2) NOT NULL CHECK (valor >= 0),
    saldo numeric(14,2) NOT NULL CHECK (saldo >= 0),
    periodo date NOT NULL CHECK (periodo = date_trunc('month', periodo)::date),
    fecha_emision date,
    fecha_vencimiento date,
    estado character varying(10) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADO', 'ANULADO')),
    id_proveedor integer REFERENCES public.personas(id) ON DELETE SET NULL,
    beneficiario character varying(120),
    numero_documento character varying(60),
    -- Servicios públicos (opcionales; sin ellos solo se compara el valor facturado)
    consumo numeric(14,3),
    unidad_consumo character varying(12),
    lectura_anterior numeric(14,3),
    lectura_actual numeric(14,3),
    soporte_url character varying(500),
    observacion text,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CHECK (saldo <= valor)
);
CREATE UNIQUE INDEX uq_fin_gastos_recurrente ON public.fin_gastos (id_recurrente, periodo) WHERE id_recurrente IS NOT NULL AND estado <> 'ANULADO';
CREATE INDEX idx_fin_gastos_negocio_periodo ON public.fin_gastos (id_negocio, periodo);
CREATE INDEX idx_fin_gastos_pendientes ON public.fin_gastos (id_negocio, fecha_vencimiento) WHERE estado IN ('PENDIENTE', 'PARCIAL');

-- ---------------------------------------------------------------------
-- Pagos de gastos. Si el dinero salió de la caja, se vincula al egreso
-- (id_egreso) y el flujo de caja cuenta el egreso una sola vez.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_pagos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_gasto integer NOT NULL REFERENCES public.fin_gastos(id) ON DELETE CASCADE,
    id_egreso integer REFERENCES public.egresos(id) ON DELETE SET NULL,
    fecha date NOT NULL,
    valor numeric(14,2) NOT NULL CHECK (valor > 0),
    medio character varying(30) NOT NULL DEFAULT 'TRANSFERENCIA',
    referencia character varying(80),
    soporte_url character varying(500),
    id_usuario integer,
    anulado boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_pagos_negocio_fecha ON public.fin_pagos (id_negocio, fecha) WHERE NOT anulado;
CREATE UNIQUE INDEX uq_fin_pagos_egreso ON public.fin_pagos (id_egreso) WHERE id_egreso IS NOT NULL AND NOT anulado;

-- ---------------------------------------------------------------------
-- Presupuestos y metas por mes (VENTAS = meta de ventas; GASTO = tope)
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_presupuestos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    periodo date NOT NULL CHECK (periodo = date_trunc('month', periodo)::date),
    tipo character varying(10) NOT NULL CHECK (tipo IN ('VENTAS', 'GASTO', 'MARGEN')),
    id_categoria integer REFERENCES public.fin_categorias(id),
    valor numeric(14,2) NOT NULL CHECK (valor >= 0),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_fin_presupuestos ON public.fin_presupuestos (id_negocio, periodo, tipo, COALESCE(id_categoria, 0));

-- Alertas configurables (umbral según el tipo)
CREATE TABLE public.fin_alertas (
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    tipo character varying(20) NOT NULL CHECK (tipo IN ('VENCIMIENTO_DIAS', 'DESVIO_PRESUPUESTO_PCT', 'MARGEN_MINIMO_PCT', 'GASTO_ALTO_PCT')),
    valor numeric(10,2) NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id_negocio, tipo)
);

-- Auditoría de cambios financieros
CREATE TABLE public.fin_auditoria (
    id bigserial PRIMARY KEY,
    id_negocio integer NOT NULL,
    tabla character varying(40) NOT NULL,
    id_registro bigint,
    accion character varying(20) NOT NULL,
    antes jsonb,
    despues jsonb,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_auditoria ON public.fin_auditoria (id_negocio, tabla, id_registro);

-- Historial de costo de cada insumo (las compras viejas no cambian)
CREATE TABLE public.inventario_costos (
    id bigserial PRIMARY KEY,
    inventario_id integer NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
    costo_anterior numeric(14,4),
    costo_nuevo numeric(14,4) NOT NULL,
    origen character varying(20) NOT NULL CHECK (origen IN ('COMPRA', 'AJUSTE', 'ANULACION')),
    id_compra bigint,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventario_costos ON public.inventario_costos (inventario_id, created_at);

-- ---------------------------------------------------------------------
-- Columnas nuevas en tablas existentes
-- ---------------------------------------------------------------------
ALTER TABLE public.inventario_movimientos ADD COLUMN costo_unitario numeric(14,4);
ALTER TABLE public.ventas_items
    ADD COLUMN costo_unitario numeric(14,4),
    ADD COLUMN costo_estimado boolean NOT NULL DEFAULT true;
ALTER TABLE public.egresos
    ADD COLUMN id_categoria integer REFERENCES public.fin_categorias(id),
    ADD COLUMN categoria_confirmada boolean NOT NULL DEFAULT false;
ALTER TABLE public.compras_items ADD COLUMN id_inventario integer REFERENCES public.inventario(id);
ALTER TABLE public.compras_items ALTER COLUMN id_producto DROP NOT NULL;
ALTER TABLE public.pagos_compras ADD COLUMN id_egreso integer REFERENCES public.egresos(id) ON DELETE SET NULL;
CREATE INDEX idx_egresos_negocio_fecha ON public.egresos (id_negocio, fecha);
CREATE INDEX idx_ventas_fecha ON public.ventas (fecha);

-- ---------------------------------------------------------------------
-- Costo de un producto hoy: receta completa (ingredientes × costo) →
-- costo del insumo (producto final) → costo de referencia (estimado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_costo_producto(p_id integer, OUT costo numeric, OUT estimado boolean)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r record;
  n_ing integer;
  n_sin_costo integer;
  c_receta numeric;
BEGIN
  costo := NULL;
  estimado := true;
  SELECT p.usa_receta, p.inventario_id, i.costo_unitario AS costo_insumo,
         (SELECT pp.precio_costo FROM productos_precios pp WHERE pp.id_producto = p.id ORDER BY pp.id DESC LIMIT 1) AS precio_costo
    INTO r
  FROM productos p LEFT JOIN inventario i ON i.id = p.inventario_id
  WHERE p.id = p_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF r.usa_receta THEN
    SELECT count(*), count(*) FILTER (WHERE COALESCE(i.costo_unitario, 0) <= 0), SUM(rc.cantidad * COALESCE(i.costo_unitario, 0))
      INTO n_ing, n_sin_costo, c_receta
    FROM recetas rc JOIN inventario i ON i.id = rc.inventario_id
    WHERE rc.producto_id = p_id;
    IF n_ing > 0 AND n_sin_costo = 0 THEN
      costo := round(c_receta, 4); estimado := false; RETURN;
    END IF;
  ELSIF r.inventario_id IS NOT NULL AND COALESCE(r.costo_insumo, 0) > 0 THEN
    costo := r.costo_insumo; estimado := false; RETURN;
  END IF;

  IF COALESCE(r.precio_costo, 0) > 0 THEN
    costo := r.precio_costo; estimado := true;
  END IF;
END;
$$;

-- Al vender: se guarda el costo del momento (no cambia si luego cambian los costos)
CREATE OR REPLACE FUNCTION public.fin_costo_venta_item() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.costo_unitario IS NULL THEN
    SELECT * INTO c FROM public.fin_costo_producto(NEW.id_producto);
    NEW.costo_unitario := c.costo;
    NEW.costo_estimado := COALESCE(c.estimado, true);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fin_costo_venta_item BEFORE INSERT ON public.ventas_items
  FOR EACH ROW EXECUTE FUNCTION public.fin_costo_venta_item();

-- Movimientos de inventario con el costo del momento
CREATE OR REPLACE FUNCTION public.fin_costo_movimiento() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.costo_unitario IS NULL THEN
    SELECT costo_unitario INTO NEW.costo_unitario FROM public.inventario WHERE id = NEW.inventario_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fin_costo_movimiento BEFORE INSERT ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.fin_costo_movimiento();

-- Ventas anteriores: costo con los costos de hoy, marcado como ESTIMADO
UPDATE public.ventas_items vi
SET costo_unitario = c.costo, costo_estimado = true
FROM (SELECT DISTINCT id_producto FROM public.ventas_items) d
CROSS JOIN LATERAL public.fin_costo_producto(d.id_producto) c
WHERE vi.id_producto = d.id_producto AND vi.costo_unitario IS NULL;

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('009_finanzas');
\else
\echo '-- 009_finanzas: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 010_finanzas_en_ventas (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '010_finanzas_en_ventas') AS pendiente,
       (NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'finanzas' AND activo)) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 010_finanzas_en_ventas: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 010_finanzas_en_ventas'
-- =====================================================================
-- 010 · Finanzas dentro del módulo Ventas
-- Las pantallas de finanzas pasan a ser pestañas de Ventas: el menú aparte
-- "Finanzas" se oculta. Los datos (gastos, pagos, metas…) no cambian.
-- Aplicar:  node scripts/migrar.js up 010_finanzas_en_ventas
-- Revertir: node scripts/migrar.js down 010_finanzas_en_ventas
-- =====================================================================
UPDATE public.app_modulos SET activo = false WHERE url = 'finanzas';

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('010_finanzas_en_ventas');
\else
\echo '-- 010_finanzas_en_ventas: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 011_tiqueteras (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '011_tiqueteras') AS pendiente,
       (to_regclass('public.tiqueteras') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 011_tiqueteras: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 011_tiqueteras'
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

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('011_tiqueteras');
\else
\echo '-- 011_tiqueteras: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 012_meseros_comandas (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '012_meseros_comandas') AS pendiente,
       (to_regclass('public.comandas') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 012_meseros_comandas: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 012_meseros_comandas'
-- =====================================================================
-- 012 · Meseros, mesas, comandas y permisos por acción
-- Aplicar:  node scripts/migrar.js up 012_meseros_comandas
-- Revertir: node scripts/migrar.js down 012_meseros_comandas
--
-- Compatibilidad: no cambia el acceso de nadie. Los usuarios SIN perfil siguen
-- como hoy (app_usuario_modulos: todo el módulo asignado). Con un perfil, solo
-- las acciones que el perfil tenga. Los perfiles por defecto (Administrador,
-- Cajero, Mesero) los crea el sistema al abrir "Módulos y permisos".
-- =====================================================================

-- ---------- Catálogo de módulos (se amplía la tabla existente) ----------
ALTER TABLE public.app_modulos ADD COLUMN descripcion character varying(255);
ALTER TABLE public.app_modulos ADD COLUMN grupo character varying(40);

INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema)
SELECT v.url, v.nombre, v.icono, v.orden, true, false
FROM (VALUES
  ('meseros',  'Meseros',            'RoomServiceIcon',        9),
  ('mesas',    'Mesas',              'TableRestaurantIcon',    9),
  ('permisos', 'Módulos y permisos', 'AdminPanelSettingsIcon', 2)
) AS v(url, nombre, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos m WHERE m.url = v.url);

UPDATE public.app_modulos m SET descripcion = v.d, grupo = v.g
FROM (VALUES
  ('home',       'Inicio del panel',                                         'General'),
  ('negocios',   'Negocios, sitio web, integraciones e impresión (sistema)', 'Sistema'),
  ('usuarios',   'Usuarios del negocio y sus módulos',                       'Administración'),
  ('permisos',   'Perfiles, permisos por acción y auditoría',                'Administración'),
  ('categorias', 'Categorías y productos (carta)',                            'Catálogo'),
  ('ventas',     'Reportes de ventas, finanzas y tiqueteras',                'Ventas'),
  ('cajero',     'Caja: cobro, mesas, egresos y cierre',                     'Ventas'),
  ('pedidos',    'Pedidos de la tienda web',                                 'Ventas'),
  ('meseros',    'Toma de pedidos en mesa (comandas)',                       'Restaurante'),
  ('mesas',      'Gestión de las mesas del restaurante',                     'Restaurante'),
  ('inventario', 'Inventario e insumos',                                     'Operación'),
  ('compras',    'Compras a proveedores',                                    'Operación'),
  ('activos',    'Activos del negocio',                                      'Operación'),
  ('finanzas',   'Finanzas (integradas en Ventas)',                          'Ventas')
) AS v(url, d, g)
WHERE m.url = v.url AND m.descripcion IS NULL;

-- "Usuarios" pasa a ser "Configuración usuarios" (incluye Módulos y permisos); se respeta si alguien lo renombró
UPDATE public.app_modulos SET nombre = 'Configuración usuarios', icono = 'ManageAccountsIcon'
WHERE url = 'usuarios' AND nombre = 'Usuarios';

-- ---------- Acciones por módulo ----------
CREATE TABLE public.app_modulos_acciones (
    id serial PRIMARY KEY,
    id_modulo integer NOT NULL REFERENCES public.app_modulos(id) ON DELETE CASCADE,
    codigo character varying(30) NOT NULL,
    nombre character varying(80) NOT NULL,
    orden smallint NOT NULL DEFAULT 1,
    UNIQUE (id_modulo, codigo)
);

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES
  ('home',       'ver',          'Consultar', 1),
  ('usuarios',   'ver',          'Consultar', 1),
  ('usuarios',   'crear',        'Crear', 2),
  ('usuarios',   'editar',       'Editar y asignar módulos', 3),
  ('usuarios',   'eliminar',     'Eliminar', 4),
  ('permisos',   'ver',          'Consultar', 1),
  ('permisos',   'administrar',  'Administrar perfiles y permisos', 2),
  ('categorias', 'ver',          'Gestionar carta', 1),
  ('ventas',     'ver',          'Consultar reportes', 1),
  ('cajero',     'ver',          'Consultar caja', 1),
  ('cajero',     'abrir_caja',   'Abrir caja', 2),
  ('cajero',     'cerrar_caja',  'Cerrar caja', 3),
  ('cajero',     'cobrar',       'Vender y cobrar', 4),
  ('cajero',     'anular',       'Anular facturas', 5),
  ('cajero',     'egresos',      'Registrar egresos', 6),
  ('pedidos',    'ver',          'Gestionar pedidos web', 1),
  ('meseros',    'ver',          'Consultar mesas y comandas', 1),
  ('meseros',    'crear',        'Crear comandas', 2),
  ('meseros',    'adicionar',    'Agregar productos a una comanda', 3),
  ('meseros',    'imprimir',     'Reimprimir comandas', 4),
  ('meseros',    'anular',       'Anular comandas', 5),
  ('meseros',    'todas',        'Atender comandas de otros meseros', 6),
  ('mesas',      'ver',          'Consultar', 1),
  ('mesas',      'crear',        'Crear', 2),
  ('mesas',      'editar',       'Editar y liberar con motivo', 3),
  ('mesas',      'desactivar',   'Activar / desactivar', 4),
  ('inventario', 'ver',          'Gestionar inventario', 1),
  ('compras',    'ver',          'Gestionar compras', 1),
  ('activos',    'ver',          'Gestionar activos', 1),
  ('finanzas',   'ver',          'Consultar finanzas', 1)
) AS v(url, codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = v.url;

-- ---------- Perfiles (roles del negocio) ----------
CREATE TABLE public.app_perfiles (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre character varying(60) NOT NULL,
    descripcion character varying(255),
    es_admin boolean NOT NULL DEFAULT false,      -- máximo privilegio: todas las acciones, no se edita ni borra
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (id_negocio, nombre)
);
CREATE UNIQUE INDEX uq_app_perfiles_admin ON public.app_perfiles (id_negocio) WHERE es_admin;

CREATE TABLE public.app_perfiles_permisos (
    id_perfil integer NOT NULL REFERENCES public.app_perfiles(id) ON DELETE CASCADE,
    id_accion integer NOT NULL REFERENCES public.app_modulos_acciones(id) ON DELETE CASCADE,
    PRIMARY KEY (id_perfil, id_accion)
);

ALTER TABLE public.usuarios ADD COLUMN id_perfil integer REFERENCES public.app_perfiles(id) ON DELETE SET NULL;

-- Auditoría de cambios administrativos (perfiles, permisos, módulos, mesas)
CREATE TABLE public.app_auditoria (
    id bigserial PRIMARY KEY,
    id_negocio integer,
    tabla character varying(40) NOT NULL,
    id_registro bigint,
    accion character varying(30) NOT NULL,
    antes jsonb,
    despues jsonb,
    id_usuario integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_auditoria ON public.app_auditoria (id_negocio, created_at DESC);

-- ---------- Mesas: activar / desactivar ----------
ALTER TABLE public.mesas ADD COLUMN activo boolean NOT NULL DEFAULT true;

-- ---------- Comandas ----------
CREATE TABLE public.comandas (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id),
    numero integer NOT NULL,                                  -- número legible por negocio
    id_mesa integer REFERENCES public.mesas(id),
    id_mesero integer NOT NULL REFERENCES public.usuarios(id),
    nota text,
    estado character varying(12) NOT NULL DEFAULT 'ABIERTA'
      CHECK (estado IN ('ABIERTA', 'EN_COBRO', 'PAGADA', 'ANULADA')),
    id_venta bigint UNIQUE REFERENCES public.ventas(id),     -- venta creada al pasar a cobro
    id_cajero integer REFERENCES public.usuarios(id),         -- quien la pasó a cobro
    en_cobro_en timestamp with time zone,
    pagada_en timestamp with time zone,
    anulada_en timestamp with time zone,
    anulada_por integer REFERENCES public.usuarios(id),
    motivo_anulacion text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (id_negocio, numero)
);
-- Una sola comanda abierta (o en cobro) por mesa
CREATE UNIQUE INDEX uq_comandas_mesa_abierta ON public.comandas (id_mesa) WHERE estado IN ('ABIERTA', 'EN_COBRO');
CREATE INDEX idx_comandas_negocio_estado ON public.comandas (id_negocio, estado, created_at DESC);

CREATE TABLE public.comandas_items (
    id serial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    tanda smallint NOT NULL DEFAULT 1,                        -- 1 = pedido inicial; 2, 3… = adiciones
    id_producto integer NOT NULL REFERENCES public.productos(id),
    nombre character varying(150) NOT NULL,                   -- como se pidió (por si cambia la carta)
    cantidad smallint NOT NULL CHECK (cantidad > 0 AND cantidad <= 99),
    precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),   -- precio de la carta, lo pone el servidor
    nota character varying(200),
    id_usuario integer REFERENCES public.usuarios(id),
    id_venta_item bigint REFERENCES public.ventas_items(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_comandas_items ON public.comandas_items (id_comanda, tanda);

-- Cada envío a la impresora: solo CONFIRMADA si el agente lo confirmó
CREATE TABLE public.comandas_impresiones (
    id serial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    tanda smallint,                                           -- NULL = toda la comanda
    tipo character varying(12) NOT NULL CHECK (tipo IN ('NUEVA', 'ADICION', 'REIMPRESION', 'REINTENTO', 'ANULACION')),
    estado character varying(12) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ENVIADA', 'CONFIRMADA', 'ERROR')),
    mensaje character varying(255),
    id_usuario integer REFERENCES public.usuarios(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    actualizado_en timestamp with time zone
);
CREATE INDEX idx_comandas_impresiones ON public.comandas_impresiones (id_comanda, created_at);

CREATE TABLE public.comandas_historial (
    id bigserial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    evento character varying(30) NOT NULL,
    detalle jsonb,
    id_usuario integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_comandas_historial ON public.comandas_historial (id_comanda, created_at);

CREATE TABLE public.comandas_idempotencia (
    clave character varying(80) PRIMARY KEY,
    id_negocio integer NOT NULL,
    resultado jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- La comanda queda PAGADA solo cuando el pago de su venta se confirma (cualquier
-- camino: cobro de mesa, tiquetera…) y ANULADA si se anula su venta.
CREATE OR REPLACE FUNCTION public.comandas_por_pago() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.estado_pago AND NOT COALESCE(OLD.estado_pago, false) THEN
    FOR c IN UPDATE comandas SET estado = 'PAGADA', pagada_en = now(), updated_at = now()
             WHERE id_venta = NEW.id_venta AND estado = 'EN_COBRO' RETURNING id
    LOOP
      INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario)
      VALUES (c.id, 'PAGADA', jsonb_build_object('metodo_pago', NEW.metodo_pago), NULLIF(current_setting('app.id_usuario', true), '')::integer);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_comandas_por_pago AFTER UPDATE OF estado_pago ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.comandas_por_pago();

CREATE OR REPLACE FUNCTION public.comandas_por_anulacion() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.estado = 'cancelado' AND OLD.estado IS DISTINCT FROM 'cancelado' THEN
    FOR c IN UPDATE comandas SET estado = 'ANULADA', anulada_en = now(), updated_at = now(),
                    anulada_por = NULLIF(current_setting('app.id_usuario', true), '')::integer,
                    motivo_anulacion = COALESCE(NEW.nota, 'Venta anulada')
             WHERE id_venta = NEW.id AND estado IN ('EN_COBRO', 'PAGADA') RETURNING id
    LOOP
      INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario)
      VALUES (c.id, 'VENTA_ANULADA', jsonb_build_object('id_venta', NEW.id, 'factura', NEW.numero_factura), NULLIF(current_setting('app.id_usuario', true), '')::integer);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_comandas_por_anulacion AFTER UPDATE OF estado ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.comandas_por_anulacion();

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('012_meseros_comandas');
\else
\echo '-- 012_meseros_comandas: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 013_pago_dividido (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '013_pago_dividido') AS pendiente,
       (to_regclass('public.pagos_medios') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 013_pago_dividido: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 013_pago_dividido'
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

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('013_pago_dividido');
\else
\echo '-- 013_pago_dividido: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 014_configuracion (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '014_configuracion') AS pendiente,
       (EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'negocio')) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 014_configuracion: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 014_configuracion'
-- =====================================================================
-- 014 · Configuración del negocio para su administrador (con permiso)
-- Aplicar:  node scripts/migrar.js up 014_configuracion
-- Revertir: node scripts/migrar.js down 014_configuracion
--
-- Módulo "Mi negocio" (url 'negocio'): datos del negocio y su página web,
-- editables por el propio negocio según permisos. La URL y el dominio siguen
-- siendo de la administración del sistema. El menú "Configuración usuarios"
-- pasa a "Configuración" (reúne usuarios, permisos, negocio y tiqueteras).
-- =====================================================================
INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema, descripcion, grupo)
SELECT 'negocio', 'Mi negocio', 'StoreIcon', 2, true, false, 'Datos del negocio y su página web', 'Administración'
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'negocio');

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES ('ver', 'Consultar', 1), ('editar', 'Editar datos del negocio', 2), ('sitio', 'Editar la página web', 3)) AS v(codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = 'negocio'
ON CONFLICT (id_modulo, codigo) DO NOTHING;

-- Disponible donde ya se administran usuarios (cada usuario lo recibe por su perfil o asignación)
INSERT INTO public.app_modulos_negocio (id_modulo, id_negocio, activo)
SELECT (SELECT id FROM public.app_modulos WHERE url = 'negocio'), mn.id_negocio, true
FROM public.app_modulos_negocio mn JOIN public.app_modulos m ON m.id = mn.id_modulo AND m.url = 'usuarios'
WHERE mn.activo
ON CONFLICT (id_modulo, id_negocio) DO NOTHING;

UPDATE public.app_modulos SET nombre = 'Configuración', icono = 'SettingsIcon'
WHERE url = 'usuarios' AND nombre IN ('Usuarios', 'Configuración usuarios');

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('014_configuracion');
\else
\echo '-- 014_configuracion: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 015_factura_al_cobrar (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '015_factura_al_cobrar') AS pendiente,
       (EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios_impresion' AND column_name = 'factura_al_cobrar')) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 015_factura_al_cobrar: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 015_factura_al_cobrar'
-- =====================================================================
-- 015 · Factura al cobrar (separada de la comanda) e impresión en Configuración
-- Aplicar:  node scripts/migrar.js up 015_factura_al_cobrar
-- Revertir: node scripts/migrar.js down 015_factura_al_cobrar
--
-- factura_al_cobrar: qué hace la caja cuando una cuenta queda pagada
--   'preguntar' (por defecto): ofrece imprimir la factura
--   'siempre': la imprime sola
--   'nunca': no la ofrece (se puede imprimir después desde las ventas)
-- Acción nueva negocio.impresion: el negocio configura su factura/ticket y su
-- agente de impresión desde Configuración (antes solo la administración del sistema).
-- =====================================================================
ALTER TABLE public.negocios_impresion ADD COLUMN factura_al_cobrar character varying(10) NOT NULL DEFAULT 'preguntar'
  CHECK (factura_al_cobrar IN ('preguntar', 'siempre', 'nunca'));

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT id, 'impresion', 'Configurar factura, ticket e impresión', 4 FROM public.app_modulos WHERE url = 'negocio'
ON CONFLICT (id_modulo, codigo) DO NOTHING;

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('015_factura_al_cobrar');
\else
\echo '-- 015_factura_al_cobrar: ya estaba aplicada, se omite'
\endif

-- ######################################################################
-- 016_publicidad (up)
-- ######################################################################
SELECT NOT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '016_publicidad') AS pendiente,
       (to_regclass('public.publicidades') IS NOT NULL) AS existe \gset
\if :pendiente
\if :existe
\echo '-- 016_publicidad: sus cambios ya están en la base (aplicada antes), solo se registra'
\else
\echo '>> Aplicando 016_publicidad'
-- =====================================================================
-- 016 · Publicidad: piezas para estados de WhatsApp (menú del día y promociones)
-- Aplicar:  node scripts/migrar.js up 016_publicidad
-- Revertir: node scripts/migrar.js down 016_publicidad
--
-- Las imágenes se arman en el navegador (1080×1920) y se comparten o descargan;
-- aquí solo se guardan los diseños para reutilizarlos.
-- =====================================================================
CREATE TABLE public.publicidades (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    plantilla character varying(20) NOT NULL CHECK (plantilla IN ('menu', 'promo')),
    nombre character varying(80) NOT NULL,
    datos jsonb NOT NULL,
    id_usuario integer REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_publicidades_negocio ON public.publicidades (id_negocio, updated_at DESC);

INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema, descripcion, grupo)
SELECT 'publicidad', 'Publicidad', 'CampaignIcon', 7, true, false, 'Menú del día y promociones para estados de WhatsApp', 'Ventas'
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'publicidad');

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES ('ver', 'Crear y descargar piezas', 1), ('guardar', 'Guardar y borrar diseños', 2)) AS v(codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = 'publicidad'
ON CONFLICT (id_modulo, codigo) DO NOTHING;

-- Disponible en los negocios que ya usan Ventas, y asignado a quienes administran usuarios
INSERT INTO public.app_modulos_negocio (id_modulo, id_negocio, activo)
SELECT (SELECT id FROM public.app_modulos WHERE url = 'publicidad'), mn.id_negocio, true
FROM public.app_modulos_negocio mn JOIN public.app_modulos m ON m.id = mn.id_modulo AND m.url = 'ventas'
WHERE mn.activo
ON CONFLICT (id_modulo, id_negocio) DO NOTHING;

INSERT INTO public.app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo)
SELECT DISTINCT um.id_usuario, (SELECT id FROM public.app_modulos WHERE url = 'publicidad'), true
FROM public.app_usuario_modulos um JOIN public.app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.url = 'usuarios'
WHERE um.activo
ON CONFLICT (id_usuario, id_modulo_negocio_rol) DO NOTHING;

\endif
INSERT INTO public.schema_migraciones (nombre) VALUES ('016_publicidad');
\else
\echo '-- 016_publicidad: ya estaba aplicada, se omite'
\endif

COMMIT;
\echo '== Actualización terminada. Migraciones aplicadas:'
\set QUIET off
SELECT nombre, aplicada_en FROM public.schema_migraciones ORDER BY nombre;
