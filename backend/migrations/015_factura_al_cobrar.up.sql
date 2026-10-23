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
