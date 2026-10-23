-- Revierte 009_finanzas: borra gastos, pagos, presupuestos, alertas, auditoría
-- y el costo histórico guardado. Las ventas, compras e inventario se conservan.
DROP TRIGGER IF EXISTS trg_fin_costo_venta_item ON public.ventas_items;
DROP TRIGGER IF EXISTS trg_fin_costo_movimiento ON public.inventario_movimientos;
DROP FUNCTION IF EXISTS public.fin_costo_venta_item();
DROP FUNCTION IF EXISTS public.fin_costo_movimiento();
DROP FUNCTION IF EXISTS public.fin_costo_producto(integer);

DROP INDEX IF EXISTS public.idx_egresos_negocio_fecha;
DROP INDEX IF EXISTS public.idx_ventas_fecha;
ALTER TABLE public.pagos_compras DROP COLUMN IF EXISTS id_egreso;
ALTER TABLE public.compras_items DROP COLUMN IF EXISTS id_inventario;
ALTER TABLE public.egresos DROP COLUMN IF EXISTS id_categoria, DROP COLUMN IF EXISTS categoria_confirmada;
ALTER TABLE public.ventas_items DROP COLUMN IF EXISTS costo_unitario, DROP COLUMN IF EXISTS costo_estimado;
ALTER TABLE public.inventario_movimientos DROP COLUMN IF EXISTS costo_unitario;

DROP TABLE IF EXISTS public.inventario_costos;
DROP TABLE IF EXISTS public.fin_auditoria;
DROP TABLE IF EXISTS public.fin_alertas;
DROP TABLE IF EXISTS public.fin_presupuestos;
DROP TABLE IF EXISTS public.fin_pagos;
DROP TABLE IF EXISTS public.fin_gastos;
DROP TABLE IF EXISTS public.fin_recurrentes;
DROP TABLE IF EXISTS public.fin_categorias;

DELETE FROM public.app_usuario_modulos WHERE id_modulo_negocio_rol IN (SELECT id FROM public.app_modulos WHERE url = 'finanzas');
DELETE FROM public.app_modulos_negocio WHERE id_modulo IN (SELECT id FROM public.app_modulos WHERE url = 'finanzas');
DELETE FROM public.app_modulos WHERE url = 'finanzas';
