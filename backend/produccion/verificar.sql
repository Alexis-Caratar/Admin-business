-- =====================================================================
-- VERIFICACIÓN (solo lectura: no cambia nada)
-- Uso: sudo -u postgres psql -d adminbusiness -f verificar.sql
-- Ejecútalo ANTES y DESPUÉS de actualizacion.sql.
-- =====================================================================
\pset footer off
\echo '== Estado de cada migración (aplicada = sus cambios están en la base)'
SELECT m.nombre, CASE WHEN m.existe THEN 'APLICADA' ELSE 'pendiente' END AS estado
FROM (VALUES
  ('001_tienda_pedidos', to_regclass('public.pedidos') IS NOT NULL),
  ('002_sitio_negocios', to_regclass('public.negocios_sitio') IS NOT NULL),
  ('003_tipos_negocio', to_regclass('public.tipos_negocio') IS NOT NULL),
  ('004_inventario', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventario_caja' AND column_name = 'stock_apertura' AND data_type = 'numeric')),
  ('005_whatsapp', to_regclass('public.notificaciones_whatsapp') IS NOT NULL),
  ('006_ficha_producto', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'productos' AND column_name = 'marca')),
  ('007_integraciones', to_regclass('public.negocios_integraciones') IS NOT NULL),
  ('008_impresion', to_regclass('public.negocios_impresion') IS NOT NULL),
  ('009_finanzas', to_regclass('public.fin_gastos') IS NOT NULL),
  ('010_finanzas_en_ventas', to_regclass('public.fin_gastos') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'finanzas' AND activo)),
  ('011_tiqueteras', to_regclass('public.tiqueteras') IS NOT NULL),
  ('012_meseros_comandas', to_regclass('public.comandas') IS NOT NULL),
  ('013_pago_dividido', to_regclass('public.pagos_medios') IS NOT NULL),
  ('014_configuracion', EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'negocio')),
  ('015_factura_al_cobrar', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'negocios_impresion' AND column_name = 'factura_al_cobrar')),
  ('016_publicidad', to_regclass('public.publicidades') IS NOT NULL)
) AS m(nombre, existe)
ORDER BY 1;

SELECT to_regclass('public.schema_migraciones') IS NOT NULL AS hay_registro \gset
\if :hay_registro
\echo '== Registro de migraciones (schema_migraciones)'
SELECT nombre, aplicada_en FROM public.schema_migraciones ORDER BY nombre;
\else
\echo '-- Aún no existe schema_migraciones (se crea con actualizacion.sql)'
\endif

\echo '== Negocios'
SELECT id, nombre, nit, activo FROM public.negocios ORDER BY id;

\echo '== Módulo Pedidos por negocio (se activa en Admin > Negocios > módulos)'
SELECT n.id, n.nombre, COALESCE(mn.activo, false) AS pedidos_activo
FROM public.negocios n
LEFT JOIN public.app_modulos m ON m.url = 'pedidos'
LEFT JOIN public.app_modulos_negocio mn ON mn.id_modulo = m.id AND mn.id_negocio = n.id
ORDER BY n.id;

\echo '== Códigos de barras repetidos dentro de un mismo negocio (deben corregirse a mano)'
SELECT c.id_negocio, p.codigo_barra, string_agg(p.id || ' ' || p.nombre, ' | ') AS productos
FROM public.productos p JOIN public.categorias c ON c.id = p.id_categoria
WHERE NULLIF(trim(p.codigo_barra), '') IS NOT NULL
GROUP BY 1, 2 HAVING count(*) > 1;

\echo '== Conteos'
SELECT (SELECT count(*) FROM public.ventas) AS ventas, (SELECT count(*) FROM public.productos) AS productos,
       (SELECT count(*) FROM public.usuarios) AS usuarios;
