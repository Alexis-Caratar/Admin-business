-- =====================================================================
-- 010 · Finanzas dentro del módulo Ventas
-- Las pantallas de finanzas pasan a ser pestañas de Ventas: el menú aparte
-- "Finanzas" se oculta. Los datos (gastos, pagos, metas…) no cambian.
-- Aplicar:  node scripts/migrar.js up 010_finanzas_en_ventas
-- Revertir: node scripts/migrar.js down 010_finanzas_en_ventas
-- =====================================================================
UPDATE public.app_modulos SET activo = false WHERE url = 'finanzas';
