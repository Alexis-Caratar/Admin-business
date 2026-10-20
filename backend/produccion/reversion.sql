-- =====================================================================
-- REVERSIÓN DE LA ACTUALIZACIÓN (producción)
-- Generado: 2026-10-20 con node scripts/armar-produccion.js (no editar a mano)
-- Migraciones: 001_tienda_pedidos, 002_sitio_negocios, 003_tipos_negocio, 004_inventario, 005_whatsapp, 006_ficha_producto, 007_integraciones, 008_impresion
--
-- Uso (solo si hay que deshacer): sudo -u postgres psql -d adminbusiness -f reversion.sql
-- ATENCIÓN: borra pedidos web, configuración de sitios, credenciales e impresión.
-- Antes, saca un respaldo con pg_dump.
--
-- Todo va en UNA transacción: si algo falla, no se aplica nada.
-- =====================================================================
\set ON_ERROR_STOP on
\set QUIET on
SET client_min_messages = warning;
BEGIN;
CREATE TABLE IF NOT EXISTS public.schema_migraciones (
    nombre character varying(100) PRIMARY KEY,
    aplicada_en timestamp without time zone NOT NULL DEFAULT now()
);

-- ######################################################################
-- 008_impresion (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '008_impresion') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 008_impresion'
-- Revierte 008_impresion: los tickets vuelven al formato fijo del agente.
DROP TABLE IF EXISTS public.negocios_impresion;

DELETE FROM public.schema_migraciones WHERE nombre = '008_impresion';
\else
\echo '-- 008_impresion: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 007_integraciones (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '007_integraciones') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 007_integraciones'
-- Revierte 007_integraciones: los negocios vuelven a usar las credenciales del .env.
DROP TABLE IF EXISTS public.negocios_integraciones;

DELETE FROM public.schema_migraciones WHERE nombre = '007_integraciones';
\else
\echo '-- 007_integraciones: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 006_ficha_producto (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '006_ficha_producto') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 006_ficha_producto'
-- Revierte 006_ficha_producto (borra la ficha web y las relaciones de variantes).
DROP INDEX IF EXISTS public.idx_productos_base;
ALTER TABLE public.productos
    DROP CONSTRAINT IF EXISTS productos_variante_no_propia,
    DROP CONSTRAINT IF EXISTS productos_variante_color_formato,
    DROP COLUMN IF EXISTS variante_color,
    DROP COLUMN IF EXISTS variante_nombre,
    DROP COLUMN IF EXISTS id_producto_base,
    DROP COLUMN IF EXISTS destacado,
    DROP COLUMN IF EXISTS fabricante,
    DROP COLUMN IF EXISTS advertencias,
    DROP COLUMN IF EXISTS cuidados,
    DROP COLUMN IF EXISTS ingredientes,
    DROP COLUMN IF EXISTS modo_uso,
    DROP COLUMN IF EXISTS atributos,
    DROP COLUMN IF EXISTS caracteristicas,
    DROP COLUMN IF EXISTS descripcion_detallada,
    DROP COLUMN IF EXISTS marca;

DELETE FROM public.schema_migraciones WHERE nombre = '006_ficha_producto';
\else
\echo '-- 006_ficha_producto: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 005_whatsapp (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '005_whatsapp') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 005_whatsapp'
-- Revierte 005_whatsapp (borra el registro de mensajes enviados).
DROP TABLE IF EXISTS public.notificaciones_whatsapp;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS avisos_whatsapp;

DELETE FROM public.schema_migraciones WHERE nombre = '005_whatsapp';
\else
\echo '-- 005_whatsapp: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 004_inventario (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '004_inventario') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 004_inventario'
-- Revierte 004_inventario: restaura los triggers originales (tal como estaban en la base)
CREATE OR REPLACE FUNCTION public.descontar_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

DECLARE
  r RECORD;
  v_usa_receta BOOLEAN;
  v_inventario_id INT;
  v_stock_actual NUMERIC;
  v_controla_inventario BOOLEAN;
  v_id_caja INT;
BEGIN

  -- ?? Obtener caja desde la venta
  SELECT id_caja INTO v_id_caja
  FROM ventas
  WHERE id = NEW.id_venta;

  -- ?? Configuraci¢n producto
  SELECT usa_receta, inventario_id, controla_inventario
  INTO v_usa_receta, v_inventario_id, v_controla_inventario
  FROM productos
  WHERE id = NEW.id_producto;

  IF v_controla_inventario IS NULL THEN
    RAISE EXCEPTION 'Producto % no configurado', NEW.id_producto;
  END IF;

  -- ================================
  -- ? SIN INVENTARIO
  -- ================================
  IF v_controla_inventario = FALSE THEN
    RETURN NEW;
  END IF;

  -- ================================
  -- ?? CON RECETA
  -- ================================
  IF v_usa_receta = TRUE THEN

    IF NOT EXISTS (
      SELECT 1 FROM recetas WHERE producto_id = NEW.id_producto
    ) THEN
      RAISE EXCEPTION 'Producto % sin receta', NEW.id_producto;
    END IF;

    FOR r IN
      SELECT inventario_id, cantidad
      FROM recetas
      WHERE producto_id = NEW.id_producto
    LOOP

      SELECT stock_actual INTO v_stock_actual
      FROM inventario
      WHERE id = r.inventario_id;

      IF v_stock_actual < (r.cantidad * NEW.cantidad) THEN
        RAISE EXCEPTION 
        'Stock insuficiente insumo % (disp: %, req: %)',
        r.inventario_id,
        v_stock_actual,
        (r.cantidad * NEW.cantidad);
      END IF;

      -- ?? Descontar
      UPDATE inventario
      SET stock_actual = stock_actual - (r.cantidad * NEW.cantidad)
      WHERE id = r.inventario_id;

      -- ?? Movimiento
      INSERT INTO inventario_movimientos (
        inventario_id,
        id_caja,
        id_venta,
        tipo,
        cantidad,
        created_at 
      )
      VALUES (
        r.inventario_id,
        v_id_caja,
        NEW.id_venta,
        'VENTA',
        r.cantidad * NEW.cantidad,
        NOW()
      );

    END LOOP;

  ELSE
  -- ================================
  -- ?? PRODUCTO DIRECTO
  -- ================================

    IF v_inventario_id IS NULL THEN
      RAISE EXCEPTION 'Producto % sin inventario', NEW.id_producto;
    END IF;

    SELECT stock_actual INTO v_stock_actual
    FROM inventario
    WHERE id = v_inventario_id;

    IF v_stock_actual < NEW.cantidad THEN
      RAISE EXCEPTION 
      'Stock insuficiente (disp: %, req: %)',
      v_stock_actual,
      NEW.cantidad;
    END IF;

    -- ?? Descontar
    UPDATE inventario
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = v_inventario_id;

    -- ?? Movimiento
    INSERT INTO inventario_movimientos (
      inventario_id,
      id_caja,
      id_venta,
      tipo,
      cantidad,
      created_at 
    )
    VALUES (
      v_inventario_id,
      v_id_caja,
      NEW.id_venta,
      'VENTA',
      NEW.cantidad,
      NOW()
    );

  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.devolver_inventario_cancelacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$

DECLARE
    d RECORD;
    r RECORD;

    v_usa_receta BOOLEAN;
    v_inventario_id INT;
    v_controla_inventario BOOLEAN;
    v_id_caja INT;
    v_id_mesa INT;

BEGIN

    -- Solo cuando pasa de ACTIVA a CANCELADA
    IF OLD.estado <> 'activa'
       OR NEW.estado <> 'cancelado' THEN
        RETURN NEW;
    END IF;

  -- Obtener caja y mesa
	SELECT id_caja, id_mesa
	INTO v_id_caja, v_id_mesa
	FROM ventas
	WHERE id = NEW.id;
	
	-- Liberar mesa si la venta tenía una mesa asociada
IF v_id_mesa IS NOT NULL THEN

    UPDATE mesas
    SET estado = 'Disponible'
    WHERE id = v_id_mesa
      AND estado = 'Ocupada';

END IF;


    -- Recorrer todos los productos vendidos
    FOR d IN

        SELECT
            id_producto,
            cantidad
        FROM ventas_items
        WHERE id_venta = NEW.id

    LOOP

        -- Configuración del producto
        SELECT
            usa_receta,
            inventario_id,
            controla_inventario
        INTO
            v_usa_receta,
            v_inventario_id,
            v_controla_inventario
        FROM productos
        WHERE id = d.id_producto;

        -- No controla inventario
        IF v_controla_inventario = FALSE THEN
            CONTINUE;
        END IF;

        --------------------------------------------------
        -- PRODUCTO CON RECETA
        --------------------------------------------------

        IF v_usa_receta = TRUE THEN

            FOR r IN

                SELECT inventario_id,
                       cantidad
                FROM recetas
                WHERE producto_id = d.id_producto

            LOOP

                UPDATE inventario
                SET stock_actual =
                    stock_actual + (r.cantidad * d.cantidad)
                WHERE id = r.inventario_id;

                INSERT INTO inventario_movimientos
                (
                    inventario_id,
                    id_caja,
                    id_venta,
                    tipo,
                    cantidad,
                    created_at
                )
                VALUES
                (
                    r.inventario_id,
                    v_id_caja,
                    NEW.id,
                    'ANULACION',
                    r.cantidad * d.cantidad,
                    NOW()
                );

            END LOOP;

        ELSE

        --------------------------------------------------
        -- PRODUCTO DIRECTO
        --------------------------------------------------

            UPDATE inventario
            SET stock_actual =
                stock_actual + d.cantidad
            WHERE id = v_inventario_id;

            INSERT INTO inventario_movimientos
            (
                inventario_id,
                id_caja,
                id_venta,
                tipo,
                cantidad,
                created_at
            )
            VALUES
            (
                v_inventario_id,
                v_id_caja,
                NEW.id,
                'ANULACION',
                d.cantidad,
                NOW()
            );

        END IF;

    END LOOP;

    RETURN NEW;

END;

$function$;

ALTER TABLE public.productos ALTER COLUMN usa_receta SET DEFAULT true;
ALTER TABLE public.inventario_caja
    ALTER COLUMN stock_apertura TYPE integer USING round(stock_apertura)::integer,
    ALTER COLUMN stock_cierre TYPE integer USING round(stock_cierre)::integer,
    ALTER COLUMN stock_sistema TYPE integer USING round(stock_sistema)::integer,
    ALTER COLUMN diferencia TYPE integer USING round(diferencia)::integer;

DELETE FROM public.schema_migraciones WHERE nombre = '004_inventario';
\else
\echo '-- 004_inventario: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 003_tipos_negocio (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '003_tipos_negocio') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 003_tipos_negocio'
-- Revierte 003_tipos_negocio. negocios.tipo (texto) se conserva.
ALTER TABLE public.negocios_sitio DROP COLUMN IF EXISTS franja_texto;
ALTER TABLE public.negocios DROP COLUMN IF EXISTS tipo_negocio;
DROP TABLE IF EXISTS public.tipos_negocio;

DELETE FROM public.schema_migraciones WHERE nombre = '003_tipos_negocio';
\else
\echo '-- 003_tipos_negocio: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 002_sitio_negocios (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '002_sitio_negocios') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 002_sitio_negocios'
-- Revierte 002_sitio_negocios. Borra el contenido de los sitios y los horarios por día.
DROP TABLE IF EXISTS public.negocios_sitio;
DROP TABLE IF EXISTS public.negocios_horarios;
ALTER TABLE public.negocios
    DROP CONSTRAINT IF EXISTS negocios_url_negocio_formato,
    DROP CONSTRAINT IF EXISTS negocios_url_negocio_key,
    DROP CONSTRAINT IF EXISTS negocios_dominio_key,
    DROP COLUMN IF EXISTS url_negocio,
    DROP COLUMN IF EXISTS dominio,
    DROP COLUMN IF EXISTS whatsapp,
    DROP COLUMN IF EXISTS latitud,
    DROP COLUMN IF EXISTS longitud,
    DROP COLUMN IF EXISTS google_maps_url;

DELETE FROM public.schema_migraciones WHERE nombre = '002_sitio_negocios';
\else
\echo '-- 002_sitio_negocios: no estaba aplicada, se omite'
\endif

-- ######################################################################
-- 001_tienda_pedidos (down)
-- ######################################################################
SELECT EXISTS (SELECT 1 FROM public.schema_migraciones WHERE nombre = '001_tienda_pedidos') AS pendiente \gset
\if :pendiente
\echo '>> Revirtiendo 001_tienda_pedidos'
-- Revierte 001_tienda_pedidos. ATENCIÓN: borra los pedidos web registrados.
-- Las ventas generadas desde pedidos se conservan (son ventas normales).
DELETE FROM public.app_usuario_modulos WHERE id_modulo_negocio_rol IN (SELECT id FROM public.app_modulos WHERE url = 'pedidos');
DELETE FROM public.app_modulos_negocio WHERE id_modulo IN (SELECT id FROM public.app_modulos WHERE url = 'pedidos');
DELETE FROM public.app_modulos WHERE url = 'pedidos';

DROP TABLE IF EXISTS public.pagos_webhook_eventos;
DROP TABLE IF EXISTS public.pedidos_transacciones;
DROP TABLE IF EXISTS public.pedidos_historial;
DROP TABLE IF EXISTS public.pedidos_items;
DROP TABLE IF EXISTS public.pedidos;
DROP SEQUENCE IF EXISTS public.pedidos_numero_seq;
-- ventas_numero_seq se conserva a propósito: el POS la usa desde esta versión
-- (si se elimina, el POS vuelve automáticamente al cálculo con MAX()+1).

DELETE FROM public.schema_migraciones WHERE nombre = '001_tienda_pedidos';
\else
\echo '-- 001_tienda_pedidos: no estaba aplicada, se omite'
\endif

COMMIT;
\echo '== Reversión terminada.'
