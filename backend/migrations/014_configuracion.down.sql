-- Revierte 014_configuracion
UPDATE public.app_modulos SET nombre = 'Configuración usuarios', icono = 'ManageAccountsIcon' WHERE url = 'usuarios' AND nombre = 'Configuración';
DELETE FROM public.app_perfiles_permisos WHERE id_accion IN (SELECT a.id FROM public.app_modulos_acciones a JOIN public.app_modulos m ON m.id = a.id_modulo WHERE m.url = 'negocio');
DELETE FROM public.app_usuario_modulos WHERE id_modulo_negocio_rol IN (SELECT id FROM public.app_modulos WHERE url = 'negocio');
DELETE FROM public.app_modulos_negocio WHERE id_modulo IN (SELECT id FROM public.app_modulos WHERE url = 'negocio');
DELETE FROM public.app_modulos WHERE url = 'negocio';
