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
