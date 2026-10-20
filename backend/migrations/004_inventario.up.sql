-- =====================================================================
-- 004 · Inventario: descuento atómico, mensajes claros y decimales
-- Aplicar:  node scripts/migrar.js up 004_inventario
-- Revertir: node scripts/migrar.js down 004_inventario
-- No modifica stock ni productos existentes.
-- =====================================================================

-- Un producto nuevo no "usa receta" salvo que se configure (antes el valor
-- por defecto era true y dejaba productos que fallaban al venderse).
ALTER TABLE public.productos ALTER COLUMN usa_receta SET DEFAULT false;

-- Conteos de caja con decimales (insumos por kilo, litro…)
ALTER TABLE public.inventario_caja
    ALTER COLUMN stock_apertura TYPE numeric(12,2),
    ALTER COLUMN stock_cierre TYPE numeric(12,2),
    ALTER COLUMN stock_sistema TYPE numeric(12,2),
    ALTER COLUMN diferencia TYPE numeric(12,2);

-- ---------------------------------------------------------------------
-- Descuento al vender. Cambios frente a la versión anterior:
--  * El descuento es atómico (UPDATE … WHERE stock_actual >= cantidad):
--    dos ventas simultáneas ya no pueden dejar el stock en negativo.
--  * Los mensajes dicen el nombre del producto o insumo, no su id.
--  * Mismo comportamiento: misma validación, mismos movimientos 'VENTA'.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.descontar_inventario()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  r RECORD;
  v_usa_receta BOOLEAN;
  v_inventario_id INT;
  v_controla_inventario BOOLEAN;
  v_nombre_producto TEXT;
  v_id_caja INT;
  v_nombre TEXT;
  v_stock NUMERIC;
BEGIN
  SELECT id_caja INTO v_id_caja FROM ventas WHERE id = NEW.id_venta;

  SELECT usa_receta, inventario_id, controla_inventario, nombre
  INTO v_usa_receta, v_inventario_id, v_controla_inventario, v_nombre_producto
  FROM productos WHERE id = NEW.id_producto;

  IF v_controla_inventario IS NULL THEN
    RAISE EXCEPTION 'El producto % no existe o no está configurado', NEW.id_producto;
  END IF;

  IF v_controla_inventario = FALSE THEN
    RETURN NEW;
  END IF;

  IF v_usa_receta = TRUE THEN
    IF NOT EXISTS (SELECT 1 FROM recetas WHERE producto_id = NEW.id_producto) THEN
      RAISE EXCEPTION '"%" está configurado con receta pero no tiene insumos. Configura la receta o cambia el modo de control.', v_nombre_producto;
    END IF;

    FOR r IN SELECT inventario_id, cantidad FROM recetas WHERE producto_id = NEW.id_producto LOOP
      UPDATE inventario
      SET stock_actual = stock_actual - (r.cantidad * NEW.cantidad)
      WHERE id = r.inventario_id AND stock_actual >= (r.cantidad * NEW.cantidad);

      IF NOT FOUND THEN
        SELECT nombre, stock_actual INTO v_nombre, v_stock FROM inventario WHERE id = r.inventario_id;
        RAISE EXCEPTION 'Stock insuficiente de "%" para "%" (disponible: %, requerido: %)',
          v_nombre, v_nombre_producto, v_stock, r.cantidad * NEW.cantidad;
      END IF;

      INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
      VALUES (r.inventario_id, v_id_caja, NEW.id_venta, 'VENTA', r.cantidad * NEW.cantidad, NOW());
    END LOOP;

  ELSE
    IF v_inventario_id IS NULL THEN
      RAISE EXCEPTION '"%" controla inventario pero no tiene un ítem de inventario asociado.', v_nombre_producto;
    END IF;

    UPDATE inventario
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = v_inventario_id AND stock_actual >= NEW.cantidad;

    IF NOT FOUND THEN
      SELECT nombre, stock_actual INTO v_nombre, v_stock FROM inventario WHERE id = v_inventario_id;
      RAISE EXCEPTION 'Stock insuficiente de "%" (disponible: %, requerido: %)', v_nombre, v_stock, NEW.cantidad;
    END IF;

    INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
    VALUES (v_inventario_id, v_id_caja, NEW.id_venta, 'VENTA', NEW.cantidad, NOW());
  END IF;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------
-- Devolución al cancelar. Cambio: devuelve exactamente lo que se
-- descontó en esa venta (sus movimientos 'VENTA'), no lo que diga hoy la
-- configuración del producto. Si alguien cambió la receta o el
-- inventario asociado después de vender, antes se devolvía a otro ítem.
-- Ventas antiguas sin movimientos (antes del trigger) no devuelven nada.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.devolver_inventario_cancelacion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  m RECORD;
BEGIN
  IF OLD.estado <> 'activa' OR NEW.estado <> 'cancelado' THEN
    RETURN NEW;
  END IF;

  IF NEW.id_mesa IS NOT NULL THEN
    UPDATE mesas SET estado = 'Disponible' WHERE id = NEW.id_mesa AND estado = 'Ocupada';
  END IF;

  FOR m IN
    SELECT inventario_id, SUM(cantidad) AS cantidad
    FROM inventario_movimientos
    WHERE id_venta = NEW.id AND tipo = 'VENTA'
    GROUP BY inventario_id
  LOOP
    UPDATE inventario SET stock_actual = stock_actual + m.cantidad WHERE id = m.inventario_id;

    INSERT INTO inventario_movimientos (inventario_id, id_caja, id_venta, tipo, cantidad, created_at)
    VALUES (m.inventario_id, NEW.id_caja, NEW.id, 'ANULACION', m.cantidad, NOW());
  END LOOP;

  RETURN NEW;
END;
$function$;
