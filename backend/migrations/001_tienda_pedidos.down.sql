-- Revierte 001_tienda_pedidos. ATENCIÓN: borra los pedidos web registrados.
-- Las ventas generadas desde pedidos se conservan (son ventas normales).
DELETE FROM public.app_usuario_modulos WHERE id_modulo_negocio_rol IN (SELECT id FROM public.app_modulos WHERE url = 'pedidos');
DELETE FROM public.app_modulos_negocio WHERE id_modulo IN (SELECT id FROM public.app_modulos WHERE url = 'pedidos');
DELETE FROM public.app_modulos WHERE url = 'pedidos';

DROP TABLE IF EXISTS public.pagos_webhook_eventos;
DROP TABLE IF EXISTS public.pedidos_transacciones;
DROP TABLE IF EXISTS public.pedidos_historial;
DROP TABLE IF EXISTS public.pedidos_items;
DROP TABLE IF EXISTS public.pedidos;
DROP SEQUENCE IF EXISTS public.pedidos_numero_seq;
-- ventas_numero_seq se conserva a propósito: el POS la usa desde esta versión
-- (si se elimina, el POS vuelve automáticamente al cálculo con MAX()+1).
