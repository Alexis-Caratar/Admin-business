# Meseros, mesas, comandas y permisos por acción

Flujo: **Mesero → Comanda → Impresora (agente local existente) → Caja → Venta (cobro de siempre)**, más un
módulo central de **Módulos y permisos** (perfiles con permisos por acción). Migración `012_meseros_comandas`.

## 1. Diagnóstico de lo que existía (auditoría)

| Pieza | Cómo estaba | Qué se hizo |
|---|---|---|
| Módulos | `app_modulos` (catálogo) + `app_modulos_negocio` (activo por negocio) + `app_usuario_modulos` (asignado al usuario). **Ojo:** `app_usuario_modulos.id_modulo_negocio_rol` guarda el **id de `app_modulos`** (el nombre engaña); `app_modulos_negocio_rol` solo aparece en un `LEFT JOIN` sin efecto. | Se reutiliza tal cual. Se agregan acciones y perfiles encima. |
| Roles | `usuarios.rol` es solo texto ("admin", "cajero", "mesero"…), no da permisos. `roles_sistema` = administración de la plataforma (pasa todo). | El perfil es el nuevo "rol con permisos". `rol` no se toca. |
| Autorización | `requiereModulo` / `negocioConModulo` en algunas rutas (pedidos, finanzas, compras, tiqueteras). | Se agrega `requierePermiso("modulo.accion")`. |
| **Brechas** | `/api/cajero/*` y `/api/usuarios/*` sin validar módulo: cualquier usuario autenticado podía abrir/cerrar caja, anular facturas o **asignarse módulos**. `actualizar_venta` sin negocio ni bloqueo (cobro doble, cobrar ventas de otro negocio). `cerrar-caja` cerraba cualquier caja por id. `liberar_mesa` liberaba con cuentas pendientes. `/admin/:modulo` abría cualquier pantalla escribiendo la URL. | Todas cerradas (ver §5). |
| Mesas | `mesas` (Disponible/Ocupada). El cobro de mesa = venta pendiente que la caja cobra después (`detallesMesa` + `actualizar_venta`). `routes/mesas.routes.js` usaba sintaxis MySQL y **no estaba montado**. | Se reemplazó por la versión PostgreSQL (§3). Estado real calculado. |
| Impresión | Agente local por WebSocket (`register_agent`, `imprimir_documento` + `resultado_impresion` en v2; `imprimir_comanda` en agentes antiguos), tickets armados en el servidor (`documentos.js`), ancho de papel por negocio. | Reutilizado. Se agregan título/etiqueta/notas por producto a la comanda y el dato `confirmado`. |
| Tiempo real | `ws` en `websockets.js`: `register_frontend`, `suscribirse_mesas`, `suscribirse_caja`, `printer_status`, `pedido_evento`. | Nuevo evento `comanda_evento` con el mismo patrón que pedidos. |

## 2. Modelo de datos (migración 012)

- `app_modulos` + columnas `descripcion`, `grupo`; módulos nuevos `meseros`, `mesas`, `permisos`.
- `app_modulos_acciones (id_modulo, codigo, nombre)`: acciones reales por módulo (tabla abajo).
- `app_perfiles (id_negocio, nombre, es_admin, activo)` + `app_perfiles_permisos (id_perfil, id_accion)`.
- `usuarios.id_perfil` (NULL = como antes).
- `app_auditoria`: cambios de perfiles, permisos, asignaciones, módulos y mesas (antes/después, quién, cuándo).
- `mesas.activo`.
- `comandas` (número legible por negocio, mesa, mesero, estado, nota, `id_venta` única, quién la pasó a cobro, anulación) con **una sola comanda abierta por mesa** (índice único parcial).
- `comandas_items` (tanda 1 = pedido, 2… = adiciones; precio de la carta puesto por el servidor; nota por producto; `id_venta_item` al cobrar).
- `comandas_impresiones` (NUEVA / ADICION / REIMPRESION / REINTENTO / ANULACION × PENDIENTE / ENVIADA / CONFIRMADA / ERROR).
- `comandas_historial`, `comandas_idempotencia`.
- Triggers: `trg_comandas_por_pago` (la comanda pasa a **PAGADA solo cuando el pago se confirma**, por cualquier camino: cobro de mesa, tiquetera…) y `trg_comandas_por_anulacion` (anular la venta anula la comanda).

### Acciones por módulo

| Módulo | Acciones |
|---|---|
| Caja (`cajero`) | ver, abrir_caja, cerrar_caja, cobrar, anular, egresos |
| Meseros (`meseros`) | ver, crear, adicionar, imprimir, anular, todas (atender comandas de otros) |
| Mesas (`mesas`) | ver, crear, editar (incluye liberar con motivo), desactivar |
| Usuarios | ver, crear, editar, eliminar |
| Módulos y permisos | ver, administrar |
| home, categorías, ventas, inventario, compras, activos, pedidos, finanzas | ver (acceso) |

Perfiles por defecto (se crean al abrir "Módulos y permisos"): **Administrador** (todas, bloqueado), **Cajero**, **Mesero** (ver, crear, adicionar, imprimir).

## 3. Flujo Mesero → Comanda → Impresora → Caja → Venta

1. El mesero (perfil Mesero) entra con su usuario de siempre; su menú solo muestra **Meseros**.
2. Ve las mesas en vivo: Disponible / Con pedido / Pendiente de pago / Ocupada (caja). El estado se **calcula** con comandas y ventas reales, no con lo que tenga el navegador.
3. Toca una mesa libre → catálogo real (el mismo selector de la caja, con complementos) → cantidades y observación por producto + observación general → **Revisar y enviar**.
4. El servidor valida (mesa del negocio, activa, sin otra comanda ni cuenta pendiente; productos de la carta), pone los precios, **guarda la comanda en una transacción** y solo después la envía a la impresora.
5. Impresión con el agente existente. Estado: `CONFIRMADA` solo si el agente v2 confirma; `ENVIADA` si es un agente antiguo (no confirma); `ERROR` si no hay agente o la impresora falla. El pedido **nunca se pierde**: queda guardado y el mesero ve "Reintentar". El ticket también se puede imprimir desde el celular.
6. Adiciones: imprimen **solo lo nuevo** con título "ADICIÓN". "Reimprimir todo" sale como **REIMPRESIÓN — COPIA, NO PREPARAR DE NUEVO**; si una tanda nunca llegó a cocina, se reenvía como original (REINTENTO). Todo queda en `comandas_impresiones`.
7. La caja recibe `comanda_evento` al instante (botón **Comandas** con contador y sonido) y, si perdió la conexión, recupera las pendientes desde la API al reconectarse (y cada 30 s).
8. El cajero abre la mesa (o "Cobrar" desde el panel) → **Pasar a cobro**: con la comanda bloqueada (`FOR UPDATE`) se crea la venta pendiente de la mesa en **su** caja abierta, con los mismos productos (sin duplicar; cada producto queda ligado a su ítem de venta). Una segunda caja recibe 409.
9. Desde ahí es el **cobro de siempre** (medios de pago, tiquetera, factura, cliente). `actualizar_venta` ahora bloquea el pago y rechaza un segundo cobro. El trigger marca la comanda PAGADA y la mesa queda libre.
10. Si mientras está en caja el mesero agrega algo (aún sin pagar), entra a la misma venta y se imprime como adición.

## 4. Eventos WebSocket

| Dirección | Mensaje | Uso |
|---|---|---|
| Pantalla → servidor | `{ tipo: "register_frontend", token }` | Recibir eventos del negocio del token |
| Pantalla → servidor | `{ tipo: "suscribirse_mesas", token }` | Recibir `{ tipo: "mesas", mesas }` (ahora con `estado_operativo`, `id_comanda`, `numero_comanda`, `estado_comanda`, `mesero`) |
| Servidor → pantallas | `{ tipo: "comanda_evento", evento, id_comanda }` | `comanda_nueva`, `comanda_actualizada`, `comanda_en_cobro`, `comanda_anulada`. Solo el id: el detalle se pide a la API, que valida permisos y negocio |
| Servidor → agente | `{ tipo: "imprimir_documento", id, documento }` (v2) / `imprimir_comanda` (antiguo) | Igual que antes |
| Agente → servidor | `{ tipo: "resultado_impresion", id, ok, error, impresora }` | Confirmación; sin ella la comanda no se marca impresa |

## 5. Seguridad aplicada

- `requierePermiso("modulo.accion")` en el backend para cada operación nueva y en la caja (abrir, cerrar, cobrar, anular, egresos, liberar), usuarios (ver, crear, editar, eliminar, asignar módulos), mesas y comandas. Ocultar botones en React es solo comodidad.
- Siempre se verifica el **negocio** del registro (comandas, mesas, ventas, cajas) contra el del token.
- Un mesero solo ve y modifica **sus** comandas (salvo la acción `meseros.todas`, o la caja/administración).
- Los precios los pone el servidor; los estados de la comanda los cambian el servidor y los triggers, nunca el cliente.
- Perfil **Administrador**: siempre todas las acciones, no se edita ni se borra. Nadie puede quitarse a sí mismo "Administrar permisos" ni dejar el negocio sin administradores.
- Compatibilidad: **usuarios sin perfil = exactamente como antes**. Se verificó con los usuarios del respaldo de producción: todos los que han usado la caja tienen el módulo Cajero y nadie pierde acceso.
- `/admin/:modulo` solo abre módulos del menú del usuario; el backend lo bloquea igual.

## 6. Instalación, configuración y despliegue

1. Base de datos: `backend/produccion/actualizacion.sql` (incluye la 012; ver `backend/produccion/LEEME.md`). En desarrollo: `node scripts/migrar.js up 012_meseros_comandas`.
2. Desplegar backend y frontend como siempre (sin variables de entorno nuevas).
3. Administración del sistema → Negocios → módulos: activar **Meseros**, **Mesas** y **Módulos y permisos** en el negocio.
4. Asignar a un administrador del negocio el módulo "Módulos y permisos" (o el perfil Administrador).
5. Módulo **Mesas**: revisar/crear las mesas.
6. Módulo **Módulos y permisos → Usuarios**: crear el usuario del mesero en Usuarios (como siempre) y asignarle el perfil **Mesero**.
7. Impresión: el agente local actual sirve tal cual; para la confirmación de impresión, agente v2 (`agente-local/README.md`).

## 7. Limitaciones conocidas (decisiones tomadas)

- Estados de cocina (en preparación / listo / entregado) no existen en el sistema actual; la comanda tiene ABIERTA ("en preparación" para el mesero), EN_COBRO, PAGADA, ANULADA.
- Toda comanda pertenece a una mesa (el flujo arranca eligiendo la mesa).
- El inventario se descuenta al pasar a cobro (igual que cualquier venta de la caja), no al tomar el pedido.
- El mesero ve los precios de la carta (consulta), pero no puede cambiarlos.
- Una comanda en caja se anula anulando la factura desde la caja (eso reintegra todo y anula la comanda).

## 7b. Interfaz

- **Configuración usuarios** (módulo `usuarios`, renombrado por la 012) reúne en un solo lugar: Usuarios (la pantalla de siempre),
  Perfiles y permisos, Asignar perfiles, Módulos y Auditoría. Las pestañas aparecen según los permisos (`usuarios.ver`, `permisos.ver`).
  Si el usuario tiene ambos módulos, la entrada "Módulos y permisos" no se repite en el menú (sigue existiendo para los permisos).
- Mesas, Meseros, Configuración usuarios y el panel de comandas de la caja usan el diseño del proyecto
  (`components/pedidos/DisenoPedidos.tsx`: `Pagina`, `TarjetaPrincipal`, `TarjetaIndicador`, `TarjetaPestanas`, `Seccion`, `Encabezado`).
- En la caja, los botones Comandas / Tiqueteras / Pedidos web van debajo de las métricas.

## 7c. Pago dividido y Configuración (013 y 014)

- **Pago dividido** (`013_pago_dividido`): en el carrito y en el cobro de mesa, método "Pago dividido". La cuenta se paga con
  2 a 5 medios (p. ej. NEQUI 10.000 + EFECTIVO 14.000); deben sumar exactamente el total (el de la venta en el servidor) y
  el cambio sale solo del efectivo. El pago queda `MIXTO` y el desglose en `pagos_medios`. La vista `v_pagos_medios`
  hace que arqueo, cierre y flujo de caja sumen cada peso en su medio. El ticket imprime el desglose. La tiquetera no entra
  en el pago dividido (tiene su propio cobro).
- **Configuración** (`014_configuracion`): módulo "Mi negocio" (`negocio`: ver, editar, sitio) con `/api/mi-negocio`
  (solo el negocio del token). El administrador del negocio edita nombre, contacto, logo y descripción, y la página web
  (textos, fotos, horarios, tienda); la URL y el dominio solo los cambia la administración del sistema. Cambios auditados.
- **Tiqueteras** siguen en Ventas (pestaña Tiqueteras). En Ventas, Compras ahora sigue el período del filtro superior.
- **Meseros**: las categorías se eligen con tarjetas con foto (cuadrícula), como las mesas.

## 7d. Factura al cobrar (015)

- La **comanda** (cocina) y la **factura** (cliente) son documentos distintos. La factura se ofrece solo cuando la cuenta
  queda pagada: cobro de mesa, venta del carrito, pago con tiquetera (incluida la factura del resto) y pago dividido.
- `negocios_impresion.factura_al_cobrar`: `preguntar` (aviso con "Imprimir factura"), `siempre` (se imprime sola) o
  `nunca` (solo desde las ventas del día). La caja lo lee de `GET /api/cajero/preferencia-factura`.
- Sin agente, la factura se puede imprimir o compartir desde el celular o el computador (visor de tickets).
- **Configuración → Factura e impresión** (acción `negocio.impresion`): la misma sección de Negocios → Impresión
  (formato, QR, comandas, factura al cobrar, agentes, token y prueba) sobre el negocio del usuario (`/api/mi-negocio/impresion`).

## 7e. Publicidad (016)

- Módulo **Publicidad** (`publicidad`: ver, guardar). Plantillas a 1080×1920 (estado de WhatsApp), dibujadas en el navegador:
  **Menú del día** (foto de fondo, tarjeta translúcida, logo, secciones editables, domicilios, teléfono y dirección; "Llenar
  desde la carta" toma los platos de las categorías de almuerzos y los complementos) y **Promoción** (etiqueta, título,
  subtítulo, destacado, descripción, condiciones; ideas rápidas como "Solo por hoy · almuerzo gratis para universitarios", "2x1").
- **WhatsApp no permite publicar estados por API.** En el celular, "Compartir" abre la hoja del sistema (WhatsApp → Mi estado);
  en el computador se descarga el PNG para subirlo.
- Fondos: fotos del negocio (página web, categorías, productos) o una subida desde el dispositivo (no se guarda con el diseño).
  Las fotos del negocio pasan por `GET /api/publicidad/imagen`, que solo acepta URLs que pertenecen al negocio, solo https,
  bloquea la red interna (localhost, privadas, metadatos) en cada redirección y limita tamaño y tipo.
- Diseños guardados por negocio en `publicidades` (`/api/publicidad`).

## 8. Archivos

**Nuevos (backend):** `migrations/012_meseros_comandas.{up,down}.sql`, `services/comandas.service.js`, `services/permisos.service.js`,
`controllers/comandas.controller.js`, `controllers/permisos.controller.js`, `routes/comandas.routes.js`, `routes/permisos.routes.js`, `tests/comandas.test.js`.
**Reemplazado:** `services/mesas.service.js` y `routes/mesas.routes.js` (eran MySQL y no estaban montados); eliminado `controllers/mesas.controller.js` (sin uso).
**Modificados (backend):** `app.js`, `middlewares/auth.middleware.js` (perfil en `requiereModulo`, `tienePermiso`, `requierePermiso`), `routes/cajero.routes.js`,
`routes/usuarios.routes.js`, `services/cajero.service.js` (mesas con estado real, `actualizaventa`, `cerrarCaja`, `liberar_mesa`, `finalizarVenta`, `detallesMesa`),
`controllers/cajero.controller.js`, `services/menusistema.service.js`, `services/impresion/{impresion.service,documentos}.js`, `websockets.js`,
`scripts/armar-produccion.js`, `produccion/*`, `tests/impresion.test.js` (acepta el rechazo más temprano de un token con negocio ajeno).
**Nuevos (frontend):** `api/comandas.ts`, `api/permisos.ts`, `hooks/usePermisos.ts`, `components/comandas/{useComandas.ts,PanelComandasCaja.tsx}`,
`pages/AdminComponents/Meseros/{MeseroPanel,PedidoEditor,ComandaVista}.tsx` + `meserosUtil.ts`, `pages/AdminComponents/Mesas/AdminMesas.tsx`,
`pages/AdminComponents/Permisos/ConfiguracionUsuarios.tsx`.
**Modificados (frontend):** `utils/mapComponents.tsx`, `utils/mapIcons.tsx`, `types/cajero.d.ts`, `pages/AdminComponents/AdminDashboard.tsx`,
`Ventas/Cajero/CajeroDashboard.tsx`, `Ventas/Cajero/components/Mesas.tsx`.

## 9. Evidencias

- `backend/tests/comandas.test.js` (12 pruebas) cubre los escenarios 1–17 del requerimiento; la suite completa (94) cubre la 18 (Ventas, Caja, impresión, tiqueteras, finanzas, tienda).
- Sobre una copia del respaldo de producción: `actualizacion.sql` aplicado y repetido sin cambios, 94/94 pruebas, `reversion.sql` correcto.
- Prueba visual con un backend y una base desechables: panel del mesero en celular, comanda con error de impresión y "Reintentar", caja con "Comandas · 1", "Pasar a cobro" → cobro de mesa (POS) con la nota de la comanda, gestión de mesas con "Pendiente de pago" y perfiles/permisos.
  Esa prueba encontró y corrigió un error real: con una comanda abierta, la caja mostraba la última factura (ya pagada) de esa mesa.
