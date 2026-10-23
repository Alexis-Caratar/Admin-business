-- =====================================================================
-- 014 · Configuración del negocio para su administrador (con permiso)
-- Aplicar:  node scripts/migrar.js up 014_configuracion
-- Revertir: node scripts/migrar.js down 014_configuracion
--
-- Módulo "Mi negocio" (url 'negocio'): datos del negocio y su página web,
-- editables por el propio negocio según permisos. La URL y el dominio siguen
-- siendo de la administración del sistema. El menú "Configuración usuarios"
-- pasa a "Configuración" (reúne usuarios, permisos, negocio y tiqueteras).
-- =====================================================================
INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema, descripcion, grupo)
SELECT 'negocio', 'Mi negocio', 'StoreIcon', 2, true, false, 'Datos del negocio y su página web', 'Administración'
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'negocio');

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES ('ver', 'Consultar', 1), ('editar', 'Editar datos del negocio', 2), ('sitio', 'Editar la página web', 3)) AS v(codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = 'negocio'
ON CONFLICT (id_modulo, codigo) DO NOTHING;

-- Disponible donde ya se administran usuarios (cada usuario lo recibe por su perfil o asignación)
INSERT INTO public.app_modulos_negocio (id_modulo, id_negocio, activo)
SELECT (SELECT id FROM public.app_modulos WHERE url = 'negocio'), mn.id_negocio, true
FROM public.app_modulos_negocio mn JOIN public.app_modulos m ON m.id = mn.id_modulo AND m.url = 'usuarios'
WHERE mn.activo
ON CONFLICT (id_modulo, id_negocio) DO NOTHING;

UPDATE public.app_modulos SET nombre = 'Configuración', icono = 'SettingsIcon'
WHERE url = 'usuarios' AND nombre IN ('Usuarios', 'Configuración usuarios');
