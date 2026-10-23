-- Revierte 010: vuelve a mostrar el menú "Finanzas".
UPDATE public.app_modulos SET activo = true WHERE url = 'finanzas';
