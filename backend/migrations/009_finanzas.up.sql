-- =====================================================================
-- 009 · Gestión financiera: costos fijos y variables, servicios, recurrentes,
--       pagos, presupuestos, alertas, auditoría y costo histórico.
-- Aplicar:  node scripts/migrar.js up 009_finanzas
-- Revertir: node scripts/migrar.js down 009_finanzas
-- Solo agrega tablas y columnas. Las ventas existentes reciben un costo
-- ESTIMADO (con los costos actuales) marcado como tal.
-- Diseño: docs/GESTION_FINANCIERA_DISENO.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- Módulo del menú (se activa por negocio en Admin > Negocios > módulos)
-- ---------------------------------------------------------------------
INSERT INTO public.app_modulos (url, nombre, icono, orden, activo, modulo_sistema)
SELECT 'finanzas', 'Finanzas', 'AccountBalanceIcon', 12, true, false
WHERE NOT EXISTS (SELECT 1 FROM public.app_modulos WHERE url = 'finanzas');

-- ---------------------------------------------------------------------
-- Categorías de costos y gastos. id_negocio NULL = del sistema (para todos).
-- grupo: FIJO · VARIABLE · SERVICIO · FUNCIONAMIENTO · NOMINA · NO_OPERATIVO
-- NO_OPERATIVO (movimientos de base, retiros, préstamos) nunca cuenta como gasto.
-- palabras: para sugerir la categoría de un egreso de caja por su descripción.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_categorias (
    id serial PRIMARY KEY,
    id_negocio integer REFERENCES public.negocios(id) ON DELETE CASCADE,
    codigo character varying(40) NOT NULL,
    nombre character varying(80) NOT NULL,
    grupo character varying(20) NOT NULL CHECK (grupo IN ('FIJO', 'VARIABLE', 'SERVICIO', 'FUNCIONAMIENTO', 'NOMINA', 'NO_OPERATIVO')),
    palabras text[] NOT NULL DEFAULT '{}',
    orden smallint NOT NULL DEFAULT 100,
    activo boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX uq_fin_categorias ON public.fin_categorias (COALESCE(id_negocio, 0), codigo);

INSERT INTO public.fin_categorias (codigo, nombre, grupo, palabras, orden) VALUES
  ('arriendo', 'Arriendo del local', 'FIJO', '{arriendo,alquiler,canon}', 10),
  ('nomina', 'Nómina y salarios', 'NOMINA', '{nomina,nómina,salario,sueldo,quincena,pago de personal,personal}', 11),
  ('seguridad_social', 'Seguridad social y prestaciones', 'NOMINA', '{seguridad social,eps,pension,pensión,arl,caja de compensacion,prima,cesantias,cesantías,vacaciones,liquidacion,liquidación}', 12),
  ('software', 'Software, licencias y suscripciones', 'FIJO', '{software,licencia,suscripcion,suscripción,hosting,dominio,aws}', 13),
  ('seguros', 'Seguros', 'FIJO', '{seguro,poliza,póliza}', 14),
  ('servicios_contratados', 'Servicios contratados', 'FIJO', '{servicio contratado,outsourcing,vigilancia}', 15),
  ('mantenimiento_periodico', 'Mantenimiento periódico', 'FIJO', '{mantenimiento mensual,mantenimiento periodico}', 16),
  ('honorarios', 'Honorarios contables y profesionales', 'FIJO', '{contador,contadora,honorarios,asesoria,asesoría}', 17),
  ('admin_otros', 'Otros gastos administrativos', 'FIJO', '{papeleria,papelería,administrativo}', 19),
  ('materia_prima', 'Materias primas e ingredientes', 'VARIABLE', '{leche,huevo,huevos,arroz,harina,azucar,azúcar,queso,pan,cafe,café,mercado,fritos,arepa,arepas,frijol,lenteja,papa,platano,plátano,maiz,maíz,mantequilla,chocolate}', 30),
  ('carnes', 'Carnes, pollo y pescado', 'VARIABLE', '{pollo,carne,res,cerdo,pescado,chorizo,salchicha,costilla,chicharron,chicharrón}', 31),
  ('verduras', 'Verduras y frutas', 'VARIABLE', '{verdura,verduras,fruta,frutas,tomate,cebolla,cilantro,aguacate,limon,limón,naranja,lulo,mora}', 32),
  ('aceites_condimentos', 'Aceites, condimentos y preparación', 'VARIABLE', '{aceite,sal,condimento,salsa,especias,vinagre,margarina}', 33),
  ('empaques', 'Empaques y desechables', 'VARIABLE', '{empaque,icopor,bolsa,bolsas,servilleta,servilletas,desechable,desechables,vaso,vasos,domicilio caja,papel aluminio,vinipel}', 34),
  ('bebidas', 'Bebidas para la venta', 'VARIABLE', '{gaseosa,gaseosas,coca,cocacola,agua en botella,jugo hit,cerveza,postobon,postobón}', 35),
  ('comisiones', 'Comisiones de plataformas y medios de pago', 'VARIABLE', '{comision,comisión,datafono,datáfono,rappi,wompi}', 36),
  ('transporte', 'Transporte y domicilios', 'VARIABLE', '{transporte,taxi,domiciliario,flete,gasolina,mototaxi}', 37),
  ('mermas', 'Mermas y desperdicios', 'VARIABLE', '{merma,desperdicio,daño,dañado,vencido}', 38),
  ('energia', 'Energía eléctrica', 'SERVICIO', '{luz,energia,energía,cedenar}', 50),
  ('agua', 'Agua y alcantarillado', 'SERVICIO', '{agua,acueducto,alcantarillado,empopasto}', 51),
  ('gas', 'Gas', 'SERVICIO', '{gas,pipeta,cilindro}', 52),
  ('internet', 'Internet', 'SERVICIO', '{internet,wifi,fibra}', 53),
  ('telefonia', 'Telefonía', 'SERVICIO', '{telefono,teléfono,celular,recarga,plan movil,plan móvil}', 54),
  ('residuos', 'Recolección de residuos', 'SERVICIO', '{basura,aseo,residuos,emas}', 55),
  ('mantenimiento_equipos', 'Mantenimiento de equipos', 'FUNCIONAMIENTO', '{mantenimiento,tecnico,técnico,nevera,estufa,horno,freidora}', 70),
  ('reparaciones', 'Reparaciones', 'FUNCIONAMIENTO', '{reparacion,reparación,arreglo,repuesto}', 71),
  ('limpieza', 'Limpieza y desinfección', 'FUNCIONAMIENTO', '{limpieza,jabon,jabón,cloro,detergente,desinfectante,escoba,trapero}', 72),
  ('plagas', 'Control de plagas', 'FUNCIONAMIENTO', '{fumigacion,fumigación,plagas}', 73),
  ('funcionamiento_otros', 'Otros gastos de funcionamiento', 'FUNCIONAMIENTO', '{}', 79),
  ('base_caja', 'Movimiento de base o traslado entre cajas', 'NO_OPERATIVO', '{base,aumento de base,traslado,cambio,sencillo,consignacion,consignación}', 90),
  ('retiro_socios', 'Retiros de los dueños', 'NO_OPERATIVO', '{retiro,socio,dueño,dueno}', 91),
  ('prestamos', 'Préstamos y abonos a créditos', 'NO_OPERATIVO', '{prestamo,préstamo,credito,crédito,abono,cuota}', 92);

-- ---------------------------------------------------------------------
-- Gastos recurrentes (plantillas). Se proyectan sin crear registros;
-- cada período se "causa" una sola vez (UNIQUE en fin_gastos).
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_recurrentes (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_categoria integer NOT NULL REFERENCES public.fin_categorias(id),
    concepto character varying(120) NOT NULL,
    valor_estimado numeric(14,2) NOT NULL CHECK (valor_estimado >= 0),
    periodicidad character varying(12) NOT NULL CHECK (periodicidad IN ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL')),
    dia_vencimiento smallint NOT NULL DEFAULT 5 CHECK (dia_vencimiento BETWEEN 1 AND 28),
    fecha_inicio date NOT NULL,
    fecha_fin date CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio),
    id_proveedor integer REFERENCES public.personas(id) ON DELETE SET NULL,
    beneficiario character varying(120),
    observacion text,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_recurrentes_negocio ON public.fin_recurrentes (id_negocio) WHERE activo;

-- ---------------------------------------------------------------------
-- Gastos causados (obligaciones): fijos, servicios, variables y nómina.
-- periodo = primer día del mes al que corresponde el gasto.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_gastos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_categoria integer NOT NULL REFERENCES public.fin_categorias(id),
    id_recurrente integer REFERENCES public.fin_recurrentes(id) ON DELETE SET NULL,
    concepto character varying(160) NOT NULL,
    valor numeric(14,2) NOT NULL CHECK (valor >= 0),
    saldo numeric(14,2) NOT NULL CHECK (saldo >= 0),
    periodo date NOT NULL CHECK (periodo = date_trunc('month', periodo)::date),
    fecha_emision date,
    fecha_vencimiento date,
    estado character varying(10) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADO', 'ANULADO')),
    id_proveedor integer REFERENCES public.personas(id) ON DELETE SET NULL,
    beneficiario character varying(120),
    numero_documento character varying(60),
    -- Servicios públicos (opcionales; sin ellos solo se compara el valor facturado)
    consumo numeric(14,3),
    unidad_consumo character varying(12),
    lectura_anterior numeric(14,3),
    lectura_actual numeric(14,3),
    soporte_url character varying(500),
    observacion text,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CHECK (saldo <= valor)
);
CREATE UNIQUE INDEX uq_fin_gastos_recurrente ON public.fin_gastos (id_recurrente, periodo) WHERE id_recurrente IS NOT NULL AND estado <> 'ANULADO';
CREATE INDEX idx_fin_gastos_negocio_periodo ON public.fin_gastos (id_negocio, periodo);
CREATE INDEX idx_fin_gastos_pendientes ON public.fin_gastos (id_negocio, fecha_vencimiento) WHERE estado IN ('PENDIENTE', 'PARCIAL');

-- ---------------------------------------------------------------------
-- Pagos de gastos. Si el dinero salió de la caja, se vincula al egreso
-- (id_egreso) y el flujo de caja cuenta el egreso una sola vez.
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_pagos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    id_gasto integer NOT NULL REFERENCES public.fin_gastos(id) ON DELETE CASCADE,
    id_egreso integer REFERENCES public.egresos(id) ON DELETE SET NULL,
    fecha date NOT NULL,
    valor numeric(14,2) NOT NULL CHECK (valor > 0),
    medio character varying(30) NOT NULL DEFAULT 'TRANSFERENCIA',
    referencia character varying(80),
    soporte_url character varying(500),
    id_usuario integer,
    anulado boolean NOT NULL DEFAULT false,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_pagos_negocio_fecha ON public.fin_pagos (id_negocio, fecha) WHERE NOT anulado;
CREATE UNIQUE INDEX uq_fin_pagos_egreso ON public.fin_pagos (id_egreso) WHERE id_egreso IS NOT NULL AND NOT anulado;

-- ---------------------------------------------------------------------
-- Presupuestos y metas por mes (VENTAS = meta de ventas; GASTO = tope)
-- ---------------------------------------------------------------------
CREATE TABLE public.fin_presupuestos (
    id serial PRIMARY KEY,
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    periodo date NOT NULL CHECK (periodo = date_trunc('month', periodo)::date),
    tipo character varying(10) NOT NULL CHECK (tipo IN ('VENTAS', 'GASTO', 'MARGEN')),
    id_categoria integer REFERENCES public.fin_categorias(id),
    valor numeric(14,2) NOT NULL CHECK (valor >= 0),
    updated_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_fin_presupuestos ON public.fin_presupuestos (id_negocio, periodo, tipo, COALESCE(id_categoria, 0));

-- Alertas configurables (umbral según el tipo)
CREATE TABLE public.fin_alertas (
    id_negocio integer NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
    tipo character varying(20) NOT NULL CHECK (tipo IN ('VENCIMIENTO_DIAS', 'DESVIO_PRESUPUESTO_PCT', 'MARGEN_MINIMO_PCT', 'GASTO_ALTO_PCT')),
    valor numeric(10,2) NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    PRIMARY KEY (id_negocio, tipo)
);

-- Auditoría de cambios financieros
CREATE TABLE public.fin_auditoria (
    id bigserial PRIMARY KEY,
    id_negocio integer NOT NULL,
    tabla character varying(40) NOT NULL,
    id_registro bigint,
    accion character varying(20) NOT NULL,
    antes jsonb,
    despues jsonb,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_auditoria ON public.fin_auditoria (id_negocio, tabla, id_registro);

-- Historial de costo de cada insumo (las compras viejas no cambian)
CREATE TABLE public.inventario_costos (
    id bigserial PRIMARY KEY,
    inventario_id integer NOT NULL REFERENCES public.inventario(id) ON DELETE CASCADE,
    costo_anterior numeric(14,4),
    costo_nuevo numeric(14,4) NOT NULL,
    origen character varying(20) NOT NULL CHECK (origen IN ('COMPRA', 'AJUSTE', 'ANULACION')),
    id_compra bigint,
    id_usuario integer,
    created_at timestamp without time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_inventario_costos ON public.inventario_costos (inventario_id, created_at);

-- ---------------------------------------------------------------------
-- Columnas nuevas en tablas existentes
-- ---------------------------------------------------------------------
ALTER TABLE public.inventario_movimientos ADD COLUMN costo_unitario numeric(14,4);
ALTER TABLE public.ventas_items
    ADD COLUMN costo_unitario numeric(14,4),
    ADD COLUMN costo_estimado boolean NOT NULL DEFAULT true;
ALTER TABLE public.egresos
    ADD COLUMN id_categoria integer REFERENCES public.fin_categorias(id),
    ADD COLUMN categoria_confirmada boolean NOT NULL DEFAULT false;
ALTER TABLE public.compras_items ADD COLUMN id_inventario integer REFERENCES public.inventario(id);
ALTER TABLE public.compras_items ALTER COLUMN id_producto DROP NOT NULL;
ALTER TABLE public.pagos_compras ADD COLUMN id_egreso integer REFERENCES public.egresos(id) ON DELETE SET NULL;
CREATE INDEX idx_egresos_negocio_fecha ON public.egresos (id_negocio, fecha);
CREATE INDEX idx_ventas_fecha ON public.ventas (fecha);

-- ---------------------------------------------------------------------
-- Costo de un producto hoy: receta completa (ingredientes × costo) →
-- costo del insumo (producto final) → costo de referencia (estimado).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fin_costo_producto(p_id integer, OUT costo numeric, OUT estimado boolean)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  r record;
  n_ing integer;
  n_sin_costo integer;
  c_receta numeric;
BEGIN
  costo := NULL;
  estimado := true;
  SELECT p.usa_receta, p.inventario_id, i.costo_unitario AS costo_insumo,
         (SELECT pp.precio_costo FROM productos_precios pp WHERE pp.id_producto = p.id ORDER BY pp.id DESC LIMIT 1) AS precio_costo
    INTO r
  FROM productos p LEFT JOIN inventario i ON i.id = p.inventario_id
  WHERE p.id = p_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF r.usa_receta THEN
    SELECT count(*), count(*) FILTER (WHERE COALESCE(i.costo_unitario, 0) <= 0), SUM(rc.cantidad * COALESCE(i.costo_unitario, 0))
      INTO n_ing, n_sin_costo, c_receta
    FROM recetas rc JOIN inventario i ON i.id = rc.inventario_id
    WHERE rc.producto_id = p_id;
    IF n_ing > 0 AND n_sin_costo = 0 THEN
      costo := round(c_receta, 4); estimado := false; RETURN;
    END IF;
  ELSIF r.inventario_id IS NOT NULL AND COALESCE(r.costo_insumo, 0) > 0 THEN
    costo := r.costo_insumo; estimado := false; RETURN;
  END IF;

  IF COALESCE(r.precio_costo, 0) > 0 THEN
    costo := r.precio_costo; estimado := true;
  END IF;
END;
$$;

-- Al vender: se guarda el costo del momento (no cambia si luego cambian los costos)
CREATE OR REPLACE FUNCTION public.fin_costo_venta_item() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE c record;
BEGIN
  IF NEW.costo_unitario IS NULL THEN
    SELECT * INTO c FROM public.fin_costo_producto(NEW.id_producto);
    NEW.costo_unitario := c.costo;
    NEW.costo_estimado := COALESCE(c.estimado, true);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fin_costo_venta_item BEFORE INSERT ON public.ventas_items
  FOR EACH ROW EXECUTE FUNCTION public.fin_costo_venta_item();

-- Movimientos de inventario con el costo del momento
CREATE OR REPLACE FUNCTION public.fin_costo_movimiento() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.costo_unitario IS NULL THEN
    SELECT costo_unitario INTO NEW.costo_unitario FROM public.inventario WHERE id = NEW.inventario_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_fin_costo_movimiento BEFORE INSERT ON public.inventario_movimientos
  FOR EACH ROW EXECUTE FUNCTION public.fin_costo_movimiento();

-- Ventas anteriores: costo con los costos de hoy, marcado como ESTIMADO
UPDATE public.ventas_items vi
SET costo_unitario = c.costo, costo_estimado = true
FROM (SELECT DISTINCT id_producto FROM public.ventas_items) d
CROSS JOIN LATERAL public.fin_costo_producto(d.id_producto) c
WHERE vi.id_producto = d.id_producto AND vi.costo_unitario IS NULL;
