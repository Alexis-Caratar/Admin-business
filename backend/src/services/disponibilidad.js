// Regla única de disponibilidad por stock (la usan el POS y la tienda web).
//  - Sin control de inventario: siempre disponible.
//  - Producto directo: su ítem de inventario tiene al menos 1.
//  - Con receta: tiene insumos y cada uno alcanza para al menos 1 unidad.
// `p` = alias de productos, `i` = alias del inventario directo (LEFT JOIN).

export const sqlConStock = (p, i) => `(
  ${p}.controla_inventario = FALSE
  OR (COALESCE(${p}.usa_receta, FALSE) = FALSE AND ${i}.stock_actual >= 1)
  OR (${p}.usa_receta = TRUE
      AND EXISTS (SELECT 1 FROM recetas rx WHERE rx.producto_id = ${p}.id)
      AND NOT EXISTS (
        SELECT 1 FROM recetas rx JOIN inventario ix ON ix.id = rx.inventario_id
        WHERE rx.producto_id = ${p}.id AND ix.stock_actual < rx.cantidad))
)`;

// Unidades disponibles (NULL = no controla inventario). Con receta: las que
// alcanzan con el insumo más escaso.
export const sqlStockDisponible = (p, i) => `(CASE
  WHEN ${p}.controla_inventario = FALSE THEN NULL
  WHEN ${p}.usa_receta = TRUE THEN (
    SELECT FLOOR(MIN(ix.stock_actual / NULLIF(rx.cantidad, 0)))
    FROM recetas rx JOIN inventario ix ON ix.id = rx.inventario_id
    WHERE rx.producto_id = ${p}.id)
  ELSE FLOOR(${i}.stock_actual)
END)`;
