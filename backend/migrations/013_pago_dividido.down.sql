-- Revierte 013_pago_dividido (los pagos mixtos quedan solo con el total, como MIXTO)
DROP VIEW IF EXISTS public.v_pagos_medios;
DROP TABLE IF EXISTS public.pagos_medios;
