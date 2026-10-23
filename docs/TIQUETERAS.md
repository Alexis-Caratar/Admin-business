# Tiqueteras de almuerzos integradas con Ventas

Una tiquetera es un paquete de almuerzos prepagados (por ejemplo, 30 almuerzos por $330.000) a nombre de un cliente.
Se vende en la caja y se usa como **medio de pago** dentro del flujo normal de venta: carrito o mesa.

## Uso diario

| Quién | Dónde | Qué hace |
|---|---|---|
| Administrador | Ventas → **Tiqueteras** → Tipos | Crea los tipos: nombre, almuerzos, precio y vigencia (vacía = no vence). |
| Administrador | Ventas → Tiqueteras → Productos | Define qué se paga con tiquetera: por categoría (por defecto, las que se llaman "Almuerzos") con excepciones por producto (Siempre / Nunca). |
| Cajero | Caja → botón **Tiqueteras** → Vender | Busca o crea el cliente, elige el tipo y el medio y cobra. El dinero entra a su caja abierta. Le entrega al cliente el QR o enlace del portal. |
| Cajero | Carrito o mesa → método **🎟️ Tiquetera** | Al confirmar, busca la tiquetera (nombre, documento, teléfono, código `TQ-…` o escaneando el QR) y ve el saldo antes y después. Si la venta tiene productos que no son almuerzo (por ejemplo, una gaseosa), elige con qué se cobran. |
| Cajero / Admin | Anular la factura (flujo actual) | Los almuerzos vuelven a la tiquetera automáticamente, una sola vez. |
| Administrador | Ventas → Tiqueteras → Tiqueteras / Consumos | Lista con saldo, estado, QR y anulación (solo sin consumos), e historial de consumos con cajero, factura y reintegros. |
| Cliente | `/tiquetera/<enlace>` o `/<negocio>/tiquetera` (código + documento) | Ve su saldo, un calendario con los días en que almorzó y el historial. |

## Tratamiento financiero (sin doble ingreso)

- **Vender la tiquetera** es dinero que entra (`tiqueteras.metodo_pago`, `id_caja`), pero **no es una venta de productos**.
  En el arqueo y el cierre suma al dinero esperado si fue en efectivo (línea "Venta de tiqueteras"). En Flujo de caja aparece como
  entrada `TIQUETERAS (<medio>)`.
- **Consumir un almuerzo** genera una venta normal (inventario, receta, comanda, factura) cuyo pago es `TIQUERERA` por el valor
  prepagado del almuerzo (precio ÷ almuerzos, sin superar el precio de la carta; la diferencia queda como descuento).
  Cuenta como ingreso del período en ventas y rentabilidad, pero **no** como dinero nuevo: el arqueo ya lo resta como digital
  y el flujo de caja lo excluye.
- **Venta mixta**: los almuerzos quedan en la factura pagada con tiquetera y el resto pasa a una factura complementaria con su
  propio pago. Los ítems se *mueven*, no se duplican, así que el inventario se descuenta una sola vez y los reportes que suponen
  un pago por venta siguen funcionando igual.

## Integridad

- El saldo se valida y descuenta **en el servidor**, dentro de una transacción, con la tiquetera bloqueada (`FOR UPDATE`):
  dos cajas cobrando a la vez el último almuerzo → solo una pasa.
- Cada cobro lleva una clave de idempotencia (`Idempotency-Key`): un doble clic o un reintento de red devuelve el mismo
  resultado sin descontar dos veces.
- Si algo falla (saldo insuficiente, tiquetera vencida o anulada, venta ya pagada, caja cerrada), no se registra nada.
- Anular la venta reintegra los almuerzos por *trigger* (`trg_tiqueteras_anulacion`), cualquiera que sea el camino de
  anulación, y deja quién, cuándo y por qué. Una venta anulada con tiquetera no se puede reactivar.
- Una tiquetera solo se anula si no tiene consumos. Si se devuelve el dinero, se registra como egreso de caja.

## Permisos

- Vender, buscar y cobrar con tiquetera: módulo **Cajero** o **Ventas**.
- Tipos, elegibilidad, listado, historial y anulación: módulo **Ventas**.
- Todo queda limitado al negocio del usuario. Anular facturas ahora también valida el negocio.
- Portal público: solo con el enlace secreto (32 caracteres) o con código + documento, con límite de intentos.
  Muestra solo el primer nombre, sin documento ni teléfono.

## Técnico

- Migración `011_tiqueteras` con las columnas `tiquetera_elegible` en categorías y productos y las tablas `tiqueteras_tipos`,
  `tiqueteras`, `tiqueteras_consumos` y `tiqueteras_idempotencia`, más el trigger. Incluida en `backend/produccion/actualizacion.sql`.
- Backend: `services/tiqueteras.service.js`, `controllers/tiqueteras.controller.js`, `routes/tiqueteras.routes.js` (`/api/tiqueteras`)
  y `routes/tiqueterasPortal.routes.js` (`/api/tiqueteras-portal`, público).
- Frontend: `api/tiqueteras.ts`; caja en `Ventas/Cajero/components/Tiqueteras/`; administración en `Ventas/Admin/AdminTiqueteras.tsx`;
  portal en `PublicComponents/tiquetera/PortalTiquetera.tsx`.
- Pruebas: `backend/tests/tiqueteras.test.js`, con los criterios de aceptación: venta, búsqueda, venta mixta, idempotencia,
  saldo insuficiente, vencida, concurrencia, mesa, anulación, permisos, portal y flujo de caja.
