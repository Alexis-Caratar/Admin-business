# Gestión administrativa y financiera — Diagnóstico y diseño (fases 1 y 2)

Estado: **propuesta para aprobar** antes de implementar. Todo lo que dice "existe" se verificó en el código
y en la base (local y en una copia del respaldo de producción `Bd/backup24072026 .dump`, marzo–julio 2026).

---

## Fase 1. Diagnóstico

### 1.1 Arquitectura
- **Backend:** Express (ESM) + PostgreSQL (`pg`), JWT con `id_negocio`, middlewares `authenticate`,
  `requiereModulo` (usuario) y `negocioConModulo` (negocio). Migraciones en `backend/migrations`,
  registro en `schema_migraciones`, paquete de producción en `backend/produccion/`. Pruebas `node:test`
  sobre una copia desechable de la base (61 pasan).
- **Frontend:** React 19 + TS + MUI 7 + MUI X DataGrid + **recharts** (ya instalado). Los menús salen de
  `app_modulos` → `componentMap` / `iconMap`; un módulo nuevo se activa por negocio como los demás.

### 1.2 Datos que ya existen y se pueden reutilizar

| Necesidad | Fuente actual | Datos reales en producción |
|---|---|---|
| Ingresos | `ventas` (subtotal, descuento, impuesto, total, estado) + `ventas_items` (cantidad, **precio_unitario** vendido) | 2.230 ventas, ~$9–10 M/mes. **0 con impuesto, 0 con descuento** |
| Medios de pago | `pagos.metodo_pago` (EFECTIVO, NEQUI, TIQUERERA, TARJETA, WOMPI, PENDIENTE) | sí |
| Anulaciones | `ventas.estado = 'cancelado'` (devuelve inventario por trigger) | 26 |
| Caja | `caja` (apertura, base, cierre, diferencia), `egresos` (monto, descripción **libre**) | 335 egresos |
| Inventario | `inventario` (stock, **costo_unitario**), `inventario_movimientos` (ENTRADA/SALIDA/VENTA/ANULACION) | 37 insumos con costo |
| Costo de producto | `productos_precios.precio_costo`; `recetas` (producto → insumo, cantidad) | 141 con costo; **0 recetas** (9 productos marcados "con receta") |
| Compras | `compras`, `compras_items`, `pagos_compras` (saldo, vencimiento, estado) | **0 registros** |
| Proveedores | `personas` (FK de `compras.id_proveedor`) | — |
| Activos | `activos` (valor, vida útil, **depreciación mensual**) | 0 |
| Empleados | `empleados` (sin salario) | 0 |
| Metas/presupuestos/costos fijos | — | no existe |

### 1.3 Brechas y problemas encontrados

1. **El módulo de compras no funciona** (por eso tiene 0 registros):
   - inserta la columna `tipo_compra`, que no existe en `compras`;
   - suma stock en `productos.stock`, que no existe (el stock vive en `inventario`);
   - sus ítems apuntan a `productos`, no a los insumos de `inventario`;
   - no genera movimientos de inventario, no actualiza costos, no registra pagos ni saldo;
   - `detalleCompra` no filtra por negocio.
2. **No hay costo histórico.** `inventario_movimientos` y `ventas_items` no guardan el costo del momento:
   hoy solo se puede calcular con el costo **actual**, que cambia. Sin esto no hay costo de ventas real por período.
3. **Los egresos de caja no tienen categoría.** La descripción mezcla nómina (≈ $10 M), materia prima
   ("leche", "pollo", "fritos"), y movimientos que **no son gastos** ("aumento de base"). Sumarlos todos como
   gasto daría un resultado falso.
4. **Recetas vacías:** 9 productos dicen "con receta" pero no tienen ingredientes: su costo y su consumo de
   inventario no se pueden calcular (el sistema ya no deja guardar productos así, pero esos 9 quedan pendientes).
5. **No existen** costos fijos, gastos recurrentes, servicios públicos, cuentas por pagar fuera de compras,
   presupuestos, metas, alertas ni auditoría financiera.
6. Devoluciones parciales no existen: solo anulación total de la venta.

---

## Fase 2. Diseño

### 2.1 Principios
- **Una sola fuente por dato:** ventas desde `ventas/ventas_items`, consumo desde `inventario_movimientos`,
  dinero que sale desde `egresos` (caja) y pagos registrados; nada se copia.
- **Tres conceptos separados, siempre etiquetados:**
  - *Costo / gasto del período* (causación): lo que corresponde al mes, se haya pagado o no.
  - *Dinero que entra y sale* (flujo de caja): solo movimientos reales de dinero.
  - *Estimado*: cuando falta un dato (sin receta, sin costo histórico) se muestra como estimado.
- **Sin doble conteo:** una compra suma al inventario (no al gasto); al pagarla, sale dinero; cuando se
  consume, pasa a costo de ventas. Un egreso de caja que paga un gasto queda **vinculado** a ese gasto.
- **Por negocio:** cada consulta filtra por `id_negocio` del token; módulo `finanzas` activable por negocio.

### 2.2 Modelo de datos (migración `009_finanzas`)

**Nuevas tablas**

| Tabla | Para qué | Campos principales |
|---|---|---|
| `fin_categorias` | Catálogo de conceptos (arriendo, nómina, energía, gas, empaques, comisiones, merma…) | `id_negocio` (NULL = del sistema), `nombre`, `grupo` (FIJO, VARIABLE, SERVICIO, NOMINA, OTRO), `tipo` (GASTO, COSTO, NO_OPERATIVO) |
| `fin_recurrentes` | Plantilla de gasto que se repite (arriendo mensual, internet…) | concepto, categoría, valor estimado, periodicidad, día de vencimiento, inicio, fin, proveedor/beneficiario |
| `fin_gastos` | Cada obligación causada (factura de energía de octubre, arriendo de octubre…) | categoría, concepto, valor, **periodo** (mes al que corresponde), emisión, vencimiento, estado (PENDIENTE/PARCIAL/PAGADO/ANULADO), saldo, `id_recurrente`, consumo + unidad + lecturas (servicios, opcionales), soporte, observación. **UNIQUE (id_recurrente, periodo)** → la proyección no duplica |
| `fin_pagos` | Pagos de gastos que **no** salen de la caja (transferencia, banco) | gasto, fecha, valor, medio, referencia, soporte |
| `fin_presupuestos` | Metas de ventas y topes de gasto por mes/categoría | periodo, tipo (VENTAS, GASTO), categoría, valor. UNIQUE por periodo+tipo+categoría |
| `fin_alertas` | Umbrales configurables | tipo (vencimiento, desvío de presupuesto, margen bajo, gasto alto), parámetro |
| `fin_auditoria` | Quién cambió qué | tabla, id, acción, antes/después (jsonb), usuario, fecha |
| `inventario_costos` | Historial de costo de cada insumo | insumo, costo, fecha, origen (compra, ajuste) |

**Columnas nuevas en tablas existentes** (no cambian datos actuales)

| Tabla | Columna | Uso |
|---|---|---|
| `inventario_movimientos` | `costo_unitario` | costo del insumo en ese momento (lo llena el trigger) |
| `ventas_items` | `costo_unitario`, `costo_estimado` (bool) | costo de lo vendido al momento de la venta (receta / insumo / costo de referencia) |
| `egresos` | `id_categoria`, `id_gasto`, `id_compra` | clasificar el egreso y vincularlo con lo que paga |
| `compras_items` | `id_inventario` | compras de insumos (se conserva `id_producto` por compatibilidad) |
| `pagos_compras` | `id_egreso` | si el pago salió de la caja, no se cuenta dos veces |

Los triggers de inventario (migración 004) se extienden para guardar el costo; **las ventas antiguas**
quedan con costo estimado (costo actual) y se marcan así en los reportes.

### 2.3 Flujos

- **Compra** (se rehace el módulo): proveedor → ítems de inventario (cantidad, costo, descuento, impuesto) →
  en una transacción: ENTRADA de inventario con su costo, **costo promedio ponderado** del insumo
  (+ historial; las compras anteriores no cambian), saldo por pagar. Pagos parciales o totales
  (`pagos_compras`), desde caja o banco. Anular una compra revierte su entrada si el stock lo permite.
- **Gasto recurrente:** se define una vez; el sistema **proyecta** los meses futuros (sin crear registros) y
  al llegar el período se "causa" con un clic (o automáticamente), creando el gasto real del mes, una sola vez.
- **Servicios públicos:** gasto con período, emisión, vencimiento, pago, y opcionalmente consumo y lecturas.
  Sin consumo registrado, la comparación es solo por valor facturado.
- **Egreso de caja:** el cajero sigue registrándolo igual; se le agrega categoría (opcional) y, en el admin,
  se puede vincular a un gasto o compra pendiente (lo marca pagado sin duplicar la salida). Herramienta para
  **clasificar los 335 egresos históricos** con sugerencias por palabra clave (nómina, leche, pollo…) que el
  administrador confirma.
- **Merma:** salida de inventario con motivo MERMA → costo variable del período, valorizado.

### 2.4 Cálculos (todos documentados y con pruebas)

| Indicador | Fórmula | Notas |
|---|---|---|
| Ventas brutas | Σ `ventas_items.subtotal` de ventas no anuladas | |
| Ingresos netos | ventas brutas − descuentos − anulaciones − impuestos incluidos | hoy impuesto y descuento = 0 en todas las ventas |
| Costo de ventas | Σ cantidad × costo_unitario guardado en la venta | ventas antiguas o sin receta: **estimado** |
| Margen bruto / % | ingresos netos − costo de ventas; ÷ ingresos netos × 100 | denominador 0 → "sin datos" |
| Margen de contribución / % | precio neto − costo variable unitario; ÷ precio neto × 100 | por producto |
| Gastos operativos | gastos causados del período (fijos, servicios, nómina, variables no incluidos en el costo) + egresos de caja clasificados como gasto + depreciación de `activos` (no monetaria) | sin categoría = "por clasificar", se muestran aparte |
| Resultado operativo estimado | margen bruto − gastos operativos | **no es utilidad neta**: no incluye impuesto de renta, intereses ni prestaciones no registradas |
| Flujo neto de caja | entradas (pagos de ventas por medio) − salidas (egresos de caja + pagos de compras y gastos fuera de caja) | transferencias y "aumento de base" excluidos |
| Crecimiento % | (actual − anterior) ÷ anterior × 100 | anterior 0 → "sin comparación" |
| Punto de equilibrio | costos fijos del mes ÷ margen de contribución % promedio | solo si el margen > 0 y hay datos del mes |
| Ticket promedio | ingresos netos ÷ número de ventas | |

Proyecciones: promedio móvil de los últimos 3 meses con estacionalidad semanal simple, **siempre rotuladas
como estimación** y con sus supuestos.

### 2.5 API (prefijo `/api/finanzas`, módulo `finanzas`)
`categorias`, `recurrentes`, `gastos` (+ `/:id/pagos`), `egresos` (clasificar/vincular), `compras`
(rehecho en `/api/compras`, mismas rutas + `pagos`, `anular`), `rentabilidad`, `flujo`, `resumen`
(dashboard), `presupuestos`, `alertas`, `exportar` (CSV). Validación en el servidor, transacciones y
auditoría en todo lo que modifica dinero.

### 2.6 Interfaz (menú "Finanzas", mismo diseño del admin)
Pestañas: **Panel** · **Gastos** (fijos, servicios, variables, recurrentes, por pagar) · **Compras** ·
**Rentabilidad** (productos y categorías, matriz volumen × margen) · **Flujo de caja** · **Metas y
presupuesto** · **Configuración** (categorías, alertas). Filtros por rango, categoría y producto; tablas
con búsqueda/orden/paginación (DataGrid); gráficos con recharts; exportar CSV y PDF (impresión).

### 2.7 Fase 3 por etapas (cada una se entrega funcionando y probada)
1. **Base:** migración 009, costo histórico en triggers, auditoría, módulo `finanzas` en el menú.
2. **Compras rehechas** + proveedores + cuentas por pagar + costo promedio.
3. **Gastos:** fijos, servicios, variables, recurrentes con proyección, pagos, clasificación de egresos.
4. **Rentabilidad por producto** y costo de ventas (con recetas; editor de recetas para los 9 pendientes).
5. **Flujo de caja.**
6. **Panel ejecutivo**, metas/presupuestos, alertas y proyecciones.
7. **Exportación, pruebas finales, documentación** y paquete de producción (`produccion/actualizacion.sql`).

### 2.8 Decisiones del negocio (confirmadas el 21/10/2026)
1. **Impuestos:** no se separan por ahora. Ingresos netos = ventas − descuentos − anulaciones.
2. **Egresos históricos:** el sistema sugiere la categoría por palabras clave y el administrador confirma.
3. **Nómina:** un gasto mensual por el total pagado (categoría Nómina).
4. **Recetas:** se incluye un editor de recetas; mientras no tengan ingredientes, esos productos usan su
   costo de referencia y se marcan como estimados.

---

## Fases 3 a 5. Implementación, validación y uso (21/10/2026)

### Instalación
1. **Base de datos:** migración `009_finanzas` (incluida en `backend/produccion/actualizacion.sql`, que ya trae 001–009).
   Local: `node scripts/migrar.js pendientes`. Producción: ver `backend/produccion/LEEME.md`.
2. **Finanzas está dentro de Ventas** (migración `010_finanzas_en_ventas`, 21/10/2026): pestañas Finanzas, Gastos, Egresos de caja,
   Rentabilidad, Flujo de caja, Compras y Metas y alertas en el módulo **Ventas**, con el mismo filtro de período.
   No hay que activar nada más: basta con tener **Ventas** activo en el negocio y asignado al usuario
   (`negocioConModulo(["ventas","finanzas"])` + `requiereModulo(["ventas","finanzas"])`). El menú aparte "Finanzas" queda oculto.
3. **Compras** usa el módulo existente "Compras" (o Finanzas).

### Uso recomendado (primer mes)
1. **Egresos de caja → Aceptar sugerencias** y corregir lo que falte (así nómina, insumos y traslados cuentan bien).
2. **Gastos → Recurrentes:** arriendo, internet, software, seguros… y **Generar gastos del mes**.
3. Registrar los **servicios públicos** de cada mes (valor, vencimiento y, si se tiene, la lectura).
4. Registrar las **compras** de insumos a proveedores (entran al inventario con su costo promedio).
5. Cargar las **recetas** de los 9 productos marcados "con receta" en Productos (la pestaña Rentabilidad los señala).
6. **Metas y alertas:** meta de ventas y tope de gastos por mes.

### Qué quedó implementado
| Área | Backend | Frontend |
|---|---|---|
| Costo histórico | triggers `fin_costo_venta_item` y `fin_costo_movimiento`; función `fin_costo_producto` | marca "estimado" en todo el módulo |
| Compras | `services/compras.service.js` rehecho (inventario, costo promedio, historial, pagos, anulación, duplicados) | `Compras/AdminCompras.tsx` rehecho |
| Gastos fijos, servicios, variables, nómina | `services/finanzas/gastos.service.js` | `Finanzas/GastosFinanzas.tsx` |
| Recurrentes y proyección | idem (`proyeccion`, `causarRecurrentes`, índice único por período) | idem |
| Clasificación de egresos de caja | `listarEgresos`, `clasificarEgresos`, `sugerir` | `Finanzas/EgresosFinanzas.tsx` |
| Resultado, rentabilidad, flujo, panel, presupuestos, alertas | `services/finanzas/reportes.service.js` | `PanelFinanzas`, `RentabilidadFinanzas`, `FlujoFinanzas`, `MetasFinanzas` |
| Auditoría | `fin_auditoria` en todo cambio de dinero | — |
| Exportar | — | CSV para Excel (separador `;`, con tildes) en cada tabla; PDF con imprimir del navegador |

### Endpoints
- `GET/POST /api/finanzas/categorias`
- `GET/POST /api/finanzas/gastos` · `GET/PUT /api/finanzas/gastos/:id` · `POST /api/finanzas/gastos/:id/anular` · `POST /api/finanzas/gastos/:id/pagos` · `DELETE /api/finanzas/gastos/:id/pagos/:id_pago`
- `GET/POST /api/finanzas/recurrentes` · `PUT /api/finanzas/recurrentes/:id` · `GET /api/finanzas/recurrentes/proyeccion` · `POST /api/finanzas/recurrentes/causar`
- `GET /api/finanzas/egresos` · `POST /api/finanzas/egresos/clasificar`
- `GET /api/finanzas/resumen` (`desde`, `hasta`, `base=teorico|compras`) · `GET /api/finanzas/resultado` · `GET /api/finanzas/rentabilidad` (`orden`, `todos`, `id_categoria`) · `GET /api/finanzas/flujo` (`agrupar`, `saldo_inicial`)
- `GET /api/finanzas/alertas` · `GET/PUT /api/finanzas/alertas/config` · `GET/PUT /api/finanzas/presupuestos`
- Compras: `GET /api/compras/listar` · `GET /api/compras/:id` · `GET /api/compras/proveedores` · `GET /api/compras/metodos-pago` · `POST /api/compras/crear` · `POST /api/compras/:id/pagos` · `DELETE /api/compras/:id/pagos/:id_pago` · `POST /api/compras/:id/anular`

### Reglas para no contar dos veces (verificadas con pruebas)
- La compra va al inventario; no es gasto. Su pago es salida de dinero (una vez, aunque salga de la caja).
- El pago de un gasto desde la caja crea y **vincula** su egreso; vincular un egreso existente no crea otro.
- Un egreso vinculado no se puede borrar ni cambiar de valor desde la caja (`egresoLibre` en `cajero.service.js`).
- Egresos clasificados como **insumos** son costo en la base "compras" y no suman a gastos operativos.
- **Traslados de base** se excluyen del flujo; **retiros y préstamos** son salida de dinero pero no gasto.
- Un recurrente se causa una sola vez por período.
- Gastos mensuales se **prorratean por días** si el rango no cubre el mes completo.

### Tratamientos y límites (documentados también en el panel)
- **Impuestos:** no se separan (decisión del negocio). En compras, el impuesto de la línea no suma al costo del insumo.
- **Depreciación:** se usa `activos.depreciacion_mensual` si hay activos registrados (hoy 0).
- **Nómina:** gasto mensual por el total pagado; prestaciones solo si se registran como gasto.
- **Gastos pagados por anticipado:** se registran en el mes al que corresponden (campo "mes"), no en el de pago.
- **Ventas antiguas (antes de la 009):** costo calculado con los costos de hoy y marcado como estimado.
- **Devoluciones parciales:** el sistema solo tiene anulación total de la venta.
- **Resultado operativo estimado ≠ utilidad neta:** no incluye impuesto de renta, intereses ni prestaciones no registradas.

### Pruebas
`backend/tests/finanzas.test.js` (10 pruebas, negocio de prueba "ZZ FIN" con cálculos manuales): costo histórico, gastos (validación,
parcial, pago desde caja, anulación), sugerencias de egresos, recurrentes sin duplicados, resultado y punto de equilibrio, flujo sin
doble conteo, compras (costo promedio con flete, factura duplicada, pagos, anulación y reversión del costo), rentabilidad,
presupuestos y crecimiento sin división por cero, aislamiento por negocio y permisos. Suite completa: **71/71**, también sobre
una copia del respaldo de producción con las 9 migraciones aplicadas.

### Pendientes
- Verificación visual de las pantallas en el navegador (se compilaron y pasaron lint, pero no se probaron con clics).
- Adjuntar archivos de soporte (hoy es un enlace a Drive/correo; no hay subida de archivos al servidor).
- Exportar a XLSX nativo y PDF con formato propio (hoy CSV y la impresión del navegador).
- Cuentas bancarias y saldos reales por cuenta (hoy el saldo inicial del flujo se escribe a mano).
- Devoluciones parciales de ventas y notas crédito.
- Nómina por empleado con prestaciones, si se necesita más adelante.
