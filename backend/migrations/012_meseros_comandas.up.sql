-- =====================================================================
-- 012 · Meseros, mesas, comandas y permisos por acción
-- Aplicar:  node scripts/migrar.js up 012_meseros_comandas
-- Revertir: node scripts/migrar.js down 012_meseros_comandas
--
-- Compatibilidad: no cambia el acceso de nadie. Los usuarios SIN perfil siguen
-- como hoy (app_usuario_modulos: todo el módulo asignado). Con un perfil, solo
-- las acciones que el perfil tenga. Los perfiles por defecto (Administrador,
-- Cajero, Mesero) los crea el sistema al abrir "Módulos y permisos".
-- =====================================================================

-- ---------- Catálogo de módulos (se amplía la tabla existente) ----------
ALTER TABLE public.app_modulos ADD COLUMN descripcion character varying(255);
ALTER TABLE public.app_modulos ADD COLUMN grupo character varying(40);

INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema)
SELECT v.url, v.nombre, v.icono, v.orden, true, false
FROM (VALUES
  ('meseros',  'Meseros',            'RoomServiceIcon',        9),
  ('mesas',    'Mesas',              'TableRestaurantIcon',    9),
  ('permisos', 'Módulos y permisos', 'AdminPanelSettingsIcon', 2)
) AS v(url, nombre, icono, orden)
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos m WHERE m.url = v.url);

UPDATE public.app_modulos m SET descripcion = v.d, grupo = v.g
FROM (VALUES
  ('home',       'Inicio del panel',                                         'General'),
  ('negocios',   'Negocios, sitio web, integraciones e impresión (sistema)', 'Sistema'),
  ('usuarios',   'Usuarios del negocio y sus módulos',                       'Administración'),
  ('permisos',   'Perfiles, permisos por acción y auditoría',                'Administración'),
  ('categorias', 'Categorías y productos (carta)',                            'Catálogo'),
  ('ventas',     'Reportes de ventas, finanzas y tiqueteras',                'Ventas'),
  ('cajero',     'Caja: cobro, mesas, egresos y cierre',                     'Ventas'),
  ('pedidos',    'Pedidos de la tienda web',                                 'Ventas'),
  ('meseros',    'Toma de pedidos en mesa (comandas)',                       'Restaurante'),
  ('mesas',      'Gestión de las mesas del restaurante',                     'Restaurante'),
  ('inventario', 'Inventario e insumos',                                     'Operación'),
  ('compras',    'Compras a proveedores',                                    'Operación'),
  ('activos',    'Activos del negocio',                                      'Operación'),
  ('finanzas',   'Finanzas (integradas en Ventas)',                          'Ventas')
) AS v(url, d, g)
WHERE m.url = v.url AND m.descripcion IS NULL;

-- "Usuarios" pasa a ser "Configuración usuarios" (incluye Módulos y permisos); se respeta si alguien lo renombró
UPDATE public.app_modulos SET nombre = 'Configuración usuarios', icono = 'ManageAccountsIcon'
WHERE url = 'usuarios' AND nombre = 'Usuarios';

-- ---------- Acciones por módulo ----------
CREATE TABLE public.app_modulos_acciones (
    id serial PRIMARY KEY,
    id_modulo integer NOT NULL REFERENCES public.app_modulos(id) ON DELETE CASCADE,
    codigo character varying(30) NOT NULL,
    nombre character varying(80) NOT NULL,
    orden smallint NOT NULL DEFAULT 1,
    UNIQUE (id_modulo, codigo)
);

INSERT INTO public.app_modulos_acciones (id_modulo, codigo, nombre, orden)
SELECT m.id, v.codigo, v.nombre, v.orden
FROM (VALUES
  ('home',       'ver',          'Consultar', 1),
  ('usuarios',   'ver',          'Consultar', 1),
  ('usuarios',   'crear',        'Crear', 2),
  ('usuarios',   'editar',       'Editar y asignar módulos', 3),
  ('usuarios',   'eliminar',     'Eliminar', 4),
  ('permisos',   'ver',          'Consultar', 1),
  ('permisos',   'administrar',  'Administrar perfiles y permisos', 2),
  ('categorias', 'ver',          'Gestionar carta', 1),
  ('ventas',     'ver',          'Consultar reportes', 1),
  ('cajero',     'ver',          'Consultar caja', 1),
  ('cajero',     'abrir_caja',   'Abrir caja', 2),
  ('cajero',     'cerrar_caja',  'Cerrar caja', 3),
  ('cajero',     'cobrar',       'Vender y cobrar', 4),
  ('cajero',     'anular',       'Anular facturas', 5),
  ('cajero',     'egresos',      'Registrar egresos', 6),
  ('pedidos',    'ver',          'Gestionar pedidos web', 1),
  ('meseros',    'ver',          'Consultar mesas y comandas', 1),
  ('meseros',    'crear',        'Crear comandas', 2),
  ('meseros',    'adicionar',    'Agregar productos a una comanda', 3),
  ('meseros',    'imprimir',     'Reimprimir comandas', 4),
  ('meseros',    'anular',       'Anular comandas', 5),
  ('meseros',    'todas',        'Atender comandas de otros meseros', 6),
  ('mesas',      'ver',          'Consultar', 1),
  ('mesas',      'crear',        'Crear', 2),
  ('mesas',      'editar',       'Editar y liberar con motivo', 3),
  ('mesas',      'desactivar',   'Activar / desactivar', 4),
  ('inventario', 'ver',          'Gestionar inventario', 1),
  ('compras',    'ver',          'Gestionar compras', 1),
  ('activos',    'ver',          'Gestionar activos', 1),
  ('finanzas',   'ver',          'Consultar finanzas', 1)
) AS v(url, codigo, nombre, orden)
JOIN public.app_modulos m ON m.url = v.url;

-- ---------- Perfiles (roles del negocio) ----------
CREATE TABLE public.app_perfiles (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    nombre character varying(60) NOT NULL,
    descripcion character varying(255),
    es_admin boolean NOT NULL DEFAULT false,      -- máximo privilegio: todas las acciones, no se edita ni borra
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (id_negocio, nombre)
);
CREATE UNIQUE INDEX uq_app_perfiles_admin ON public.app_perfiles (id_negocio) WHERE es_admin;

CREATE TABLE public.app_perfiles_permisos (
    id_perfil integer NOT NULL REFERENCES public.app_perfiles(id) ON DELETE CASCADE,
    id_accion integer NOT NULL REFERENCES public.app_modulos_acciones(id) ON DELETE CASCADE,
    PRIMARY KEY (id_perfil, id_accion)
);

ALTER TABLE public.usuarios ADD COLUMN id_perfil integer REFERENCES public.app_perfiles(id) ON DELETE SET NULL;

-- Auditoría de cambios administrativos (perfiles, permisos, módulos, mesas)
CREATE TABLE public.app_auditoria (
    id bigserial PRIMARY KEY,
    id_negocio integer,
    tabla character varying(40) NOT NULL,
    id_registro bigint,
    accion character varying(30) NOT NULL,
    antes jsonb,
    despues jsonb,
    id_usuario integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_app_auditoria ON public.app_auditoria (id_negocio, created_at DESC);

-- ---------- Mesas: activar / desactivar ----------
ALTER TABLE public.mesas ADD COLUMN activo boolean NOT NULL DEFAULT true;

-- ---------- Comandas ----------
CREATE TABLE public.comandas (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id),
    numero integer NOT NULL,                                  -- número legible por negocio
    id_mesa integer REFERENCES public.mesas(id),
    id_mesero integer NOT NULL REFERENCES public.usuarios(id),
    nota text,
    estado character varying(12) NOT NULL DEFAULT 'ABIERTA'
      CHECK (estado IN ('ABIERTA', 'EN_COBRO', 'PAGADA', 'ANULADA')),
    id_venta bigint UNIQUE REFERENCES public.ventas(id),     -- venta creada al pasar a cobro
    id_cajero integer REFERENCES public.usuarios(id),         -- quien la pasó a cobro
    en_cobro_en timestamp with time zone,
    pagada_en timestamp with time zone,
    anulada_en timestamp with time zone,
    anulada_por integer REFERENCES public.usuarios(id),
    motivo_anulacion text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (id_negocio, numero)
);
-- Una sola comanda abierta (o en cobro) por mesa
CREATE UNIQUE INDEX uq_comandas_mesa_abierta ON public.comandas (id_mesa) WHERE estado IN ('ABIERTA', 'EN_COBRO');
CREATE INDEX idx_comandas_negocio_estado ON public.comandas (id_negocio, estado, created_at DESC);

CREATE TABLE public.comandas_items (
    id serial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    tanda smallint NOT NULL DEFAULT 1,                        -- 1 = pedido inicial; 2, 3… = adiciones
    id_producto integer NOT NULL REFERENCES public.productos(id),
    nombre character varying(150) NOT NULL,                   -- como se pidió (por si cambia la carta)
    cantidad smallint NOT NULL CHECK (cantidad > 0 AND cantidad <= 99),
    precio_unitario numeric(12,2) NOT NULL CHECK (precio_unitario >= 0),   -- precio de la carta, lo pone el servidor
    nota character varying(200),
    id_usuario integer REFERENCES public.usuarios(id),
    id_venta_item bigint REFERENCES public.ventas_items(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_comandas_items ON public.comandas_items (id_comanda, tanda);

-- Cada envío a la impresora: solo CONFIRMADA si el agente lo confirmó
CREATE TABLE public.comandas_impresiones (
    id serial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    tanda smallint,                                           -- NULL = toda la comanda
    tipo character varying(12) NOT NULL CHECK (tipo IN ('NUEVA', 'ADICION', 'REIMPRESION', 'REINTENTO', 'ANULACION')),
    estado character varying(12) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ENVIADA', 'CONFIRMADA', 'ERROR')),
    mensaje character varying(255),
    id_usuario integer REFERENCES public.usuarios(id),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    actualizado_en timestamp with time zone
);
CREATE INDEX idx_comandas_impresiones ON public.comandas_impresiones (id_comanda, created_at);

CREATE TABLE public.comandas_historial (
    id bigserial PRIMARY KEY,
    id_comanda integer NOT NULL REFERENCES public.comandas(id) ON DELETE CASCADE,
    evento character varying(30) NOT NULL,
    detalle jsonb,
    id_usuario integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_comandas_historial ON public.comandas_historial (id_comanda, created_at);

CREATE TABLE public.comandas_idempotencia (
    clave character varying(80) PRIMARY KEY,
    id_negocio integer NOT NULL,
    resultado jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- La comanda queda PAGADA solo cuando el pago de su venta se confirma (cualquier
-- camino: cobro de mesa, tiquetera…) y ANULADA si se anula su venta.
CREATE OR REPLACE FUNCTION public.comandas_por_pago() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.estado_pago AND NOT COALESCE(OLD.estado_pago, false) THEN
    FOR c IN UPDATE comandas SET estado = 'PAGADA', pagada_en = now(), updated_at = now()
             WHERE id_venta = NEW.id_venta AND estado = 'EN_COBRO' RETURNING id
    LOOP
      INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario)
      VALUES (c.id, 'PAGADA', jsonb_build_object('metodo_pago', NEW.metodo_pago), NULLIF(current_setting('app.id_usuario', true), '')::integer);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_comandas_por_pago AFTER UPDATE OF estado_pago ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.comandas_por_pago();

CREATE OR REPLACE FUNCTION public.comandas_por_anulacion() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.estado = 'cancelado' AND OLD.estado IS DISTINCT FROM 'cancelado' THEN
    FOR c IN UPDATE comandas SET estado = 'ANULADA', anulada_en = now(), updated_at = now(),
                    anulada_por = NULLIF(current_setting('app.id_usuario', true), '')::integer,
                    motivo_anulacion = COALESCE(NEW.nota, 'Venta anulada')
             WHERE id_venta = NEW.id AND estado IN ('EN_COBRO', 'PAGADA') RETURNING id
    LOOP
      INSERT INTO comandas_historial (id_comanda, evento, detalle, id_usuario)
      VALUES (c.id, 'VENTA_ANULADA', jsonb_build_object('id_venta', NEW.id, 'factura', NEW.numero_factura), NULLIF(current_setting('app.id_usuario', true), '')::integer);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_comandas_por_anulacion AFTER UPDATE OF estado ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.comandas_por_anulacion();
