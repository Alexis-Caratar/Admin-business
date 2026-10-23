-- =====================================================================
-- 016 · Publicidad: piezas para estados de WhatsApp (menú del día y promociones)
-- Aplicar:  node scripts/migrar.js up 016_publicidad
-- Revertir: node scripts/migrar.js down 016_publicidad
--
-- Las imágenes se arman en el navegador (1080×1920) y se comparten o descargan;
-- aquí solo se guardan los diseños para reutilizarlos.
-- =====================================================================
CREATE TABLE public.publicidades (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    plantilla character varying(20) NOT NULL CHECK (plantilla IN ('menu', 'promo')),
    nombre character varying(80) NOT NULL,
    datos jsonb NOT NULL,
    id_usuario integer REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_publicidades_negocio ON public.publicidades (id_negocio, updated_at DESC);

INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema, descripcion, grupo)
SELECT 'publicidad', 'Publicidad', 'CampaignIcon', 7, true, false, 'Menú del día y promociones para estados de WhatsApp', 'Ventas'
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'publicidad');

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES ('ver', 'Crear y descargar piezas', 1), ('guardar', 'Guardar y borrar diseños', 2)) AS v(codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = 'publicidad'
ON CONFLICT (id_modulo, codigo) DO NOTHING;

-- Disponible en los negocios que ya usan Ventas, y asignado a quienes administran usuarios
INSERT INTO public.app_modulos_negocio (id_modulo, id_negocio, activo)
SELECT (SELECT id FROM public.app_modulos WHERE url = 'publicidad'), mn.id_negocio, true
FROM public.app_modulos_negocio mn JOIN public.app_modulos m ON m.id = mn.id_modulo AND m.url = 'ventas'
WHERE mn.activo
ON CONFLICT (id_modulo, id_negocio) DO NOTHING;

INSERT INTO public.app_usuario_modulos (id_usuario, id_modulo_negocio_rol, activo)
SELECT DISTINCT um.id_usuario, (SELECT id FROM public.app_modulos WHERE url = 'publicidad'), true
FROM public.app_usuario_modulos um JOIN public.app_modulos m ON m.id = um.id_modulo_negocio_rol AND m.url = 'usuarios'
WHERE um.activo
ON CONFLICT (id_usuario, id_modulo_negocio_rol) DO NOTHING;
