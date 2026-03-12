"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VentasDetalles;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var Close_1 = require("@mui/icons-material/Close");
var Print_1 = require("@mui/icons-material/Print");
var ReceiptLong_1 = require("@mui/icons-material/ReceiptLong");
var Person_1 = require("@mui/icons-material/Person");
var Payments_1 = require("@mui/icons-material/Payments");
var Search_1 = require("@mui/icons-material/Search");
var PointOfSale_1 = require("@mui/icons-material/PointOfSale");
var AddShoppingCart_1 = require("@mui/icons-material/AddShoppingCart");
var framer_motion_1 = require("framer-motion");
var sweetalert2_1 = require("sweetalert2");
var cajero_1 = require("../../../../../../api/cajero");
function VentasDetalles(_a) {
    var _this = this;
    var open = _a.open, onClose = _a.onClose, id_caja = _a.id_caja, idUsuario = _a.idUsuario, id_negocio = _a.id_negocio;
    var _b = (0, react_1.useState)([]), ventas = _b[0], setVentas = _b[1];
    var _c = (0, react_1.useState)(""), busqueda = _c[0], setBusqueda = _c[1];
    var _d = (0, react_1.useState)(1), pagina = _d[0], setPagina = _d[1];
    var _e = (0, react_1.useState)("todas"), filtro = _e[0], setFiltro = _e[1];
    var _f = (0, react_1.useState)(false), detalleOpen = _f[0], setDetalleOpen = _f[1];
    var _g = (0, react_1.useState)(null), ventaSeleccionada = _g[0], setVentaSeleccionada = _g[1];
    var _h = (0, react_1.useState)([]), productosDetalle = _h[0], setProductosDetalle = _h[1];
    var _j = (0, react_1.useState)(false), loadingDetalle = _j[0], setLoadingDetalle = _j[1];
    var _k = (0, react_1.useState)(false), openPago = _k[0], setOpenPago = _k[1];
    var _l = (0, react_1.useState)("EFECTIVO"), metodoPago = _l[0], setMetodoPago = _l[1];
    var _m = (0, react_1.useState)(""), montoRecibido = _m[0], setMontoRecibido = _m[1];
    var _o = (0, react_1.useState)(0), cambio = _o[0], setCambio = _o[1];
    var porPagina = 10;
    (0, react_1.useEffect)(function () {
        if (open && id_caja)
            cargarVentas();
    }, [open, id_caja]);
    (0, react_1.useEffect)(function () {
        // recalcular cambio automáticamente
        if (metodoPago === "EFECTIVO" && ventaSeleccionada) {
            var total = Number(ventaSeleccionada.venta_total || 0);
            setCambio(Number(montoRecibido || 0) - total);
        }
    }, [montoRecibido, metodoPago, ventaSeleccionada]);
    var cargarVentas = function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, cajero_1.facturaPorCaja)({ id_caja: id_caja })];
                case 1:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok)
                        setVentas(data.result);
                    return [2 /*return*/];
            }
        });
    }); };
    var abrirDetalle = function (venta) { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setVentaSeleccionada(venta);
                    setDetalleOpen(true);
                    setLoadingDetalle(true);
                    return [4 /*yield*/, (0, cajero_1.productosPorVenta)({ id_venta: venta.id_venta })];
                case 1:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok)
                        setProductosDetalle(data.result);
                    setLoadingDetalle(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var imprimir = (0, react_1.useCallback)(function () { return window.print(); }, []);
    /* ================= METRICAS ================= */
    var metrics = (0, react_1.useMemo)(function () {
        var totalPagadas = ventas.filter(function (v) { return Number(v.estado_pago) === 1; }).length;
        var totalPendientes = ventas.filter(function (v) { return Number(v.estado_pago) === 0; }).length;
        var totalVentas = ventas.filter(function (v) { return Number(v.estado_pago) === 1; })
            .reduce(function (acc, v) { return acc + Number(v.venta_total || 0); }, 0);
        var pendiente_pago = ventas.filter(function (v) { return Number(v.estado_pago) === 0; })
            .reduce(function (acc, v) { return acc + Number(v.venta_total || 0); }, 0);
        return { totalPagadas: totalPagadas, totalPendientes: totalPendientes, totalVentas: totalVentas, pendiente_pago: pendiente_pago };
    }, [ventas]);
    /* ================= FILTROS ================= */
    var ventasFiltradas = (0, react_1.useMemo)(function () {
        var data = __spreadArray([], ventas, true);
        if (filtro === "pagadas")
            data = data.filter(function (v) { return Number(v.estado_pago) === 1; });
        if (filtro === "pendientes")
            data = data.filter(function (v) { return Number(v.estado_pago) === 0; });
        if (busqueda)
            data = data.filter(function (v) { var _a; return (_a = v.numero_factura) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(busqueda.toLowerCase()); });
        return data;
    }, [ventas, filtro, busqueda]);
    var totalPaginas = Math.ceil(ventasFiltradas.length / porPagina);
    var ventasPagina = ventasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);
    // utils/format.ts
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };
    /* ================= FINALIZAR VENTA ================= */
    var handleFinalizarVenta = function () { return __awaiter(_this, void 0, void 0, function () {
        var payload, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!ventaSeleccionada)
                        return [2 /*return*/];
                    console.log("ventaSeleccionada", ventaSeleccionada);
                    payload = {
                        idUsuario: idUsuario,
                        id_negocio: id_negocio,
                        id_venta: ventaSeleccionada.id_pago,
                        metodo_pago: metodoPago,
                        monto_recibido: montoRecibido,
                        cambio: cambio
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, cajero_1.actualiza_venta)(payload)];
                case 2:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok) {
                        setOpenPago(false);
                        setDetalleOpen(false);
                        setVentaSeleccionada(null);
                        setMontoRecibido("");
                        setMetodoPago("EFECTIVO");
                        cargarVentas();
                        sweetalert2_1.default.fire({
                            title: "Venta registrada",
                            html: "<b style=\"font-size:18px;color:#16a34a\">\u2705 Operaci\u00F3n exitosa</b><br/><br/>La venta se guard\u00F3 correctamente",
                            icon: "success",
                            confirmButtonText: "Aceptar",
                            confirmButtonColor: "#16a34a",
                        });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    sweetalert2_1.default.fire({
                        icon: "error",
                        title: "Error al registrar la venta",
                        text: "Ocurrió un problema al guardar la venta. Intente nuevamente.",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#d32f2f",
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "xl", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { sx: { borderBottom: "1px solid #eee" }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "primary.main", width: 48, height: 48 }, children: (0, jsx_runtime_1.jsx)(PointOfSale_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, fontSize: 18, children: "Ventas de Caja" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", children: new Date().toLocaleDateString("es-CO") })] })] }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: onClose, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, size: "small", placeholder: "Buscar factura...", value: busqueda, onChange: function (e) { setBusqueda(e.target.value); setPagina(1); }, sx: { mb: 3 }, InputProps: {
                                    startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(Search_1.default, {}) })),
                                } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, mb: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 200px", children: (0, jsx_runtime_1.jsx)(material_1.Card, { onClick: function () { return setFiltro("todas"); }, sx: { p: 2, borderRadius: 3, cursor: "pointer" }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, children: [(0, jsx_runtime_1.jsx)(ReceiptLong_1.default, { color: "primary" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: "Facturas" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, children: ventas.length })] })] }) }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 200px", children: (0, jsx_runtime_1.jsx)(material_1.Card, { onClick: function () { return setFiltro("pagadas"); }, sx: { p: 2, borderRadius: 3, bgcolor: "#e8f5e9", cursor: "pointer" }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, children: [(0, jsx_runtime_1.jsx)(Payments_1.default, { color: "success" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: "Pagadas" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, color: "success.main", children: metrics.totalPagadas })] })] }) }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 200px", children: (0, jsx_runtime_1.jsx)(material_1.Card, { onClick: function () { return setFiltro("pendientes"); }, sx: { p: 2, borderRadius: 3, bgcolor: "#ffebee", cursor: "pointer" }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, children: [(0, jsx_runtime_1.jsx)(Payments_1.default, { color: "error" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: "Pendientes" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, color: "error.main", children: metrics.totalPendientes })] })] }) }) })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 3, children: ventasPagina.map(function (venta) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 250px", children: (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { whileHover: { scale: 1.03 }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                                                borderRadius: 3,
                                                p: 2,
                                                cursor: "pointer",
                                                transition: "0.2s",
                                                "&:hover": { boxShadow: 6 },
                                            }, onClick: function () { return abrirDetalle(venta); }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { width: 36, height: 36 }, children: (0, jsx_runtime_1.jsx)(ReceiptLong_1.default, { fontSize: "small" }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 14, children: venta.numero_factura }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", children: venta.fecha })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: 1 }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: venta.metodo_pago, color: venta.estado_pago === 1 ? "success" : "warning", size: "small" })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 1, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: "Total" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: formatCOP(venta.venta_total) })] }) })] }) }) }, venta.id_venta)); }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { mt: 4, display: "flex", justifyContent: "center", children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPaginas, page: pagina, onChange: function (_event, value) { return setPagina(value); } }) })] }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { borderTop: "1px solid #eee" }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, ml: "auto", children: [(0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { px: 3, py: 1, bgcolor: "#ffebee" }, children: (0, jsx_runtime_1.jsxs)(material_1.Typography, { color: "error.main", fontWeight: 700, children: ["Por cobrar: ", formatCOP(metrics.pendiente_pago)] }) }), (0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { px: 3, py: 1, bgcolor: "#e8f5e9" }, children: (0, jsx_runtime_1.jsxs)(material_1.Typography, { color: "success.main", fontWeight: 700, children: ["Vendido: ", formatCOP(metrics.totalVentas)] }) })] }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: detalleOpen, onClose: function () { return setDetalleOpen(false); }, PaperProps: { sx: { borderRadius: 4, width: 420, maxWidth: "95%", overflow: "hidden" } }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: { background: "linear-gradient(135deg,#1976d2,#42a5f5)", color: "#fff", p: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "rgba(255,255,255,0.2)" }, children: (0, jsx_runtime_1.jsx)(ReceiptLong_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, children: "Factura" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, children: ["#", ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.numero_factura] })] })] }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: function () { return setDetalleOpen(false); }, sx: { color: "#fff" }, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { background: "#fafafa" }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, alignItems: "center", sx: { p: 2, borderRadius: 3, background: "#fff", mb: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.cliente_imagen, sx: { width: 46, height: 46 }, children: (0, jsx_runtime_1.jsx)(Person_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: "Cliente" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.nombre_completo })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: 1 }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: (ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.estado_pago) === 1 ? "Pagado" : "Pendiente", color: (ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.estado_pago) === 1 ? "success" : "warning", size: "small" })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { maxHeight: 260, overflowY: "auto", px: 1 }, children: loadingDetalle ? ((0, jsx_runtime_1.jsx)(material_1.Box, { py: 4, textAlign: "center", children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 26 }) })) : ((0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 1, children: productosDetalle.map(function (p) { return ((0, jsx_runtime_1.jsxs)(material_1.Card, { sx: { p: 1, borderRadius: 2, display: "flex", alignItems: "center", gap: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: p.url_imagen, variant: "rounded", sx: { width: 40, height: 40 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { flex: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 13, fontWeight: 600, children: p.nombre }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: ["Cantidad: ", p.cantidad] })] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 13, children: formatCOP(p.subtotal) })] }, p.id_producto)); }) })) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { p: 2, borderRadius: 3, background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "TOTAL" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 900, fontSize: 22, color: "primary", children: formatCOP(ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.venta_total) })] })] }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { p: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1, width: "100%", children: [(ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.estado_pago) === 0 && ((0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, variant: "contained", color: "success", size: "large", startIcon: (0, jsx_runtime_1.jsx)(Payments_1.default, {}), sx: { borderRadius: 3, fontWeight: 700 }, onClick: function () { return setOpenPago(true); }, children: "Finalizar Venta" })), (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, startIcon: (0, jsx_runtime_1.jsx)(Print_1.default, {}), variant: "outlined", sx: { borderRadius: 3 }, onClick: imprimir, children: "Imprimir Factura" })] }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openPago, onClose: function () { return setOpenPago(false); }, maxWidth: "xs", fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, children: "Finalizar Venta" }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: function () { return setOpenPago(false); }, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { mb: 1, fontWeight: 700, children: "Total a pagar" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 24, fontWeight: 900, color: "primary", children: formatCOP(ventaSeleccionada === null || ventaSeleccionada === void 0 ? void 0 : ventaSeleccionada.venta_total) }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, fullWidth: true, label: "M\u00E9todo de Pago", size: "small", sx: { mt: 3 }, value: metodoPago, onChange: function (e) { return setMetodoPago(e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "EFECTIVO", children: "\uD83D\uDCB5 Efectivo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TRANSFERENCIA", children: "\uD83C\uDFE6 Transferencia" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TARJETA", children: "\uD83D\uDCB3 Tarjeta" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "PENDIENTE", children: "\u23F3 Pendiente de Pago" })] }), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, autoFocus: true, label: "Monto recibido", size: "small", sx: { mt: 2 }, value: montoRecibido === "" ? "" : formatCOP(montoRecibido), onChange: function (e) { return setMontoRecibido(Number(e.target.value.replace(/\D/g, ""))); } }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { mt: 2, fontWeight: 800 }, color: cambio < 0 ? "error.main" : "success.main", children: ["Cambio: ", formatCOP(cambio)] })] }))] }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { p: 2 }, children: (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, variant: "contained", color: "success", disabled: metodoPago === "EFECTIVO" && cambio < 0, startIcon: (0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, {}), onClick: handleFinalizarVenta, sx: { borderRadius: 3, fontWeight: 700 }, children: "PAGAR FACTURA" }) })] })] }));
}
