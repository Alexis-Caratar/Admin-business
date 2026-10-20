-- Revierte 005_whatsapp (borra el registro de mensajes enviados).
DROP TABLE IF EXISTS public.notificaciones_whatsapp;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS avisos_whatsapp;
