-- Revierte 015_factura_al_cobrar
DELETE FROM public.app_perfiles_permisos WHERE id_accion IN (SELECT a.id FROM public.app_modulos_acciones a JOIN public.app_modulos m ON m.id = a.id_modulo WHERE m.url = 'negocio' AND a.codigo = 'impresion');
DELETE FROM public.app_modulos_acciones WHERE codigo = 'impresion' AND id_modulo = (SELECT id FROM public.app_modulos WHERE url = 'negocio');
ALTER TABLE public.negocios_impresion DROP COLUMN IF EXISTS factura_al_cobrar;
