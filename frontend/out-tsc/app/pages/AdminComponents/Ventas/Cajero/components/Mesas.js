"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mesas = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var CheckCircle_1 = require("@mui/icons-material/CheckCircle");
var Restaurant_1 = require("@mui/icons-material/Restaurant");
var EventSeat_1 = require("@mui/icons-material/EventSeat");
var Close_1 = require("@mui/icons-material/Close");
var AddShoppingCart_1 = require("@mui/icons-material/AddShoppingCart");
var cajero_1 = require("../../../../../api/cajero");
var sweetalert2_1 = require("sweetalert2");
var Mesas = function (_a) {
    var idUsuario = _a.idUsuario, id_negocio = _a.id_negocio, mesas = _a.mesas, mesaSeleccionada = _a.mesaSeleccionada, onSelect = _a.onSelect;
    var _b = (0, react_1.useState)(null), mesaOrden = _b[0], setMesaOrden = _b[1];
    var _c = (0, react_1.useState)(false), openOrden = _c[0], setOpenOrden = _c[1];
    var _d = (0, react_1.useState)(null), detalleVenta = _d[0], setDetalleVenta = _d[1];
    var _e = (0, react_1.useState)(false), loadingDetalle = _e[0], setLoadingDetalle = _e[1];
    var _f = (0, react_1.useState)("EFECTIVO"), metodoPago = _f[0], setMetodoPago = _f[1];
    var _g = (0, react_1.useState)(""), montoRecibido = _g[0], setMontoRecibido = _g[1];
    var _h = (0, react_1.useState)(false), setHabilitarPago = _h[1];
    var theme = (0, material_1.useTheme)();
    var isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down("sm"));
    var getEstadoConfig = function (estado) {
        switch (estado) {
            case "Disponible":
                return { chipColor: "linear-gradient(135deg, #09a58e, #2e7d32)", iconBg: "#1eab35", icon: (0, jsx_runtime_1.jsx)(CheckCircle_1.default, {}) };
            case "Ocupada":
                return { chipColor: "linear-gradient(135deg, #ff416c, #ff4b2b)", iconBg: "#221d1d", icon: (0, jsx_runtime_1.jsx)(Restaurant_1.default, {}) };
            case "Reservada":
                return { chipColor: "linear-gradient(135deg, #f7971e, #ffd200)", iconBg: "#ef6c00", icon: (0, jsx_runtime_1.jsx)(EventSeat_1.default, {}) };
            default:
                return { chipColor: "#616161", iconBg: "#616161", icon: (0, jsx_runtime_1.jsx)(EventSeat_1.default, {}) };
        }
    };
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(value);
    };
    var cambio = (Number(montoRecibido) || 0) - ((detalleVenta === null || detalleVenta === void 0 ? void 0 : detalleVenta.venta_total) || 0);
    var cambioSeguro = Math.max(cambio, 0);
    var handleClickMesa = function (mesa) { return __awaiter(void 0, void 0, void 0, function () {
        var data, venta, productosParsed, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (mesa.estado === "Disponible") {
                        onSelect === null || onSelect === void 0 ? void 0 : onSelect(mesa);
                        return [2 /*return*/];
                    }
                    // Mesa Ocupada o Reservada
                    setMesaOrden(mesa);
                    setOpenOrden(true);
                    setLoadingDetalle(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, cajero_1.apidetallesMesa)({ id_negocio: id_negocio, mesaId: mesa.id })];
                case 2:
                    data = (_a.sent()).data;
                    if (!(data === null || data === void 0 ? void 0 : data.ok) || !Array.isArray(data.result) || data.result.length === 0) {
                        setDetalleVenta(null);
                        setLoadingDetalle(false);
                        return [2 /*return*/];
                    }
                    venta = data.result[0];
                    productosParsed = [];
                    try {
                        productosParsed = typeof venta.productos === "string" ? JSON.parse(venta.productos) : venta.productos;
                    }
                    catch (error) {
                        console.warn("Error parseando productos:", error);
                    }
                    setDetalleVenta(__assign(__assign({}, venta), { productos: productosParsed }));
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error("Error cargando detalles de mesa:", err_1);
                    setDetalleVenta(null);
                    return [3 /*break*/, 5];
                case 4:
                    setLoadingDetalle(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleLiberarMesa = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Aquí llamas tu API para liberar la mesa
                    return [4 /*yield*/, (0, cajero_1.liberar_mesa)(mesaOrden === null || mesaOrden === void 0 ? void 0 : mesaOrden.id, id_negocio)];
                case 1:
                    // Aquí llamas tu API para liberar la mesa
                    _a.sent();
                    sweetalert2_1.default.fire({
                        icon: "success",
                        title: "Mesa liberada",
                        toast: true,
                        position: "top-end",
                        showConfirmButton: false,
                        timer: 2800,
                        timerProgressBar: true
                    });
                    onSelect === null || onSelect === void 0 ? void 0 : onSelect(null);
                    setOpenOrden(false);
                    setDetalleVenta(null);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error(error_1);
                    alert("❌ Error al liberar mesa");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleFinalizarVenta = function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, data, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!detalleVenta)
                        return [2 /*return*/];
                    payload = {
                        idUsuario: idUsuario,
                        id_negocio: id_negocio,
                        id_venta: detalleVenta.id_pago,
                        id_mesa: mesaOrden === null || mesaOrden === void 0 ? void 0 : mesaOrden.id,
                        metodo_pago: metodoPago,
                        monto_recibido: montoRecibido,
                        cambio: cambioSeguro,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, cajero_1.actualiza_venta)(payload)];
                case 2:
                    data = (_a.sent()).data;
                    // Reiniciar modal
                    if (data === null || data === void 0 ? void 0 : data.ok) {
                        // 🔥 limpiar mesa seleccionada
                        onSelect === null || onSelect === void 0 ? void 0 : onSelect(null);
                    }
                    setDetalleVenta(null);
                    setHabilitarPago(false);
                    setMontoRecibido("");
                    setMetodoPago("EFECTIVO");
                    setOpenOrden(false);
                    sweetalert2_1.default.fire({
                        title: "Venta registrada",
                        html: "\n        <b style=\"font-size:18px;color:#16a34a\">\n          \u2705 Operaci\u00F3n exitosa\n        </b>\n        <br/><br/>\n        La venta se guard\u00F3 correctamente\n    ",
                        icon: "success",
                        confirmButtonText: "Aceptar",
                        confirmButtonColor: "#16a34a",
                        showClass: {
                            popup: "animate__animated animate__zoomIn"
                        },
                        hideClass: {
                            popup: "animate__animated animate__zoomOut"
                        }
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    console.error("Error al actualizar venta:", err_2);
                    sweetalert2_1.default.fire({
                        icon: "error",
                        title: "Error al registrar la venta",
                        text: "Ocurrió un problema al guardar la venta. Intente nuevamente.",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#d32f2f",
                        background: "#ffffff",
                        color: "#1e293b"
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { width: "100%", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, mb: 1, sx: { fontSize: { xs: 16, md: 22 } }, children: "Mesas del Restaurante" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2, // espacio entre cards
                }, children: mesas.map(function (mesa) {
                    var config = getEstadoConfig(mesa.estado);
                    var isSelected = (mesaSeleccionada === null || mesaSeleccionada === void 0 ? void 0 : mesaSeleccionada.id) === mesa.id;
                    return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                            flex: "1 1 150px", // mínimo 150px, crece según contenedor
                            maxWidth: 320, // opcional, evita que se estire demasiado
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { onClick: function () { return handleClickMesa(mesa); }, sx: {
                                position: "relative",
                                p: { xs: 2, sm: 5 },
                                borderRadius: 3,
                                minHeight: { xs: 130, sm: 160 },
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                background: isSelected
                                    ? "linear-gradient(135deg, rgba(25,118,210,.08), rgba(25,118,210,.02))"
                                    : "#fff",
                                border: isSelected ? "2px solid" : "1px solid rgba(0,0,0,0.08)",
                                borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.08)",
                                boxShadow: isSelected
                                    ? "0 0 0 3px rgba(25,118,210,.25)"
                                    : { xs: "0 4px 12px rgba(0,0,0,0.08)", md: "0 10px 25px rgba(0,0,0,0.08)" },
                                transition: "all .25s ease",
                                "&:hover": {
                                    transform: { xs: "none", md: "translateY(-6px)" },
                                },
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: mesa.estado, size: "small", sx: {
                                        position: "absolute",
                                        top: 11,
                                        right: 20,
                                        fontWeight: 700,
                                        height: 24,
                                        px: 3,
                                        borderRadius: 2,
                                        background: config.chipColor,
                                        color: "#fff",
                                    } }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                        mt: { xs: 3, sm: 4 },
                                        width: { xs: 38, sm: 48 },
                                        height: { xs: 38, sm: 48 },
                                        borderRadius: "50%",
                                        background: "linear-gradient(135deg, ".concat(config.iconBg, ")"),
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mb: 1,
                                    }, children: config.icon }), (0, jsx_runtime_1.jsxs)(material_1.Box, { textAlign: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, sx: { fontSize: { xs: 12, sm: 18 } }, noWrap: true, children: mesa.nombre }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { fontSize: { xs: 12, sm: 15 } }, color: "text.secondary", children: ["Cap: ", mesa.capacidad, " pers"] })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { flexGrow: 0 }), isSelected && ((0, jsx_runtime_1.jsx)(material_1.Chip, { label: isMobile ? "select.." : "Seleccionada", color: "primary", size: "small", sx: { fontWeight: 700, borderRadius: 2, mb: 0.1 } }))] }) }, mesa.id));
                }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openOrden, onClose: function () { return setOpenOrden(false); }, maxWidth: "sm", fullWidth: true, children: [(0, jsx_runtime_1.jsxs)(material_1.DialogTitle, { sx: { fontWeight: 700, pb: 1 }, children: ["\uD83E\uDDFE Orden - ", mesaOrden === null || mesaOrden === void 0 ? void 0 : mesaOrden.nombre, (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: function () { return setOpenOrden(false); }, sx: { position: "absolute", right: 8, top: 8 }, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { dividers: true, sx: { bgcolor: "#f8fafc" }, children: [!loadingDetalle && detalleVenta && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                            p: 2,
                                            mb: 2,
                                            borderRadius: 3,
                                            bgcolor: "#fff",
                                            border: "1px solid #e5e7eb",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: detalleVenta.nombre_completo }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["Documento: ", detalleVenta.identificacion_cliente] })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                    px: { xs: 1.5, sm: 2 },
                                                    py: { xs: 0.6, sm: 0.8 },
                                                    borderRadius: { xs: 1.5, sm: 2 },
                                                    background: "linear-gradient(135deg,#1e293b,#111827)",
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                                                    letterSpacing: { xs: 0.5, sm: 1 },
                                                    boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                                                    textAlign: "center",
                                                    maxWidth: "100%",
                                                    whiteSpace: "nowrap",
                                                }, children: detalleVenta.numero_factura })] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, mb: 1, children: "Detalle de Productos" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { borderRadius: 3, overflow: "hidden", border: "1px solid #e5e7eb", bgcolor: "#fff" }, children: detalleVenta.productos.map(function (prod) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", justifyContent: "space-between", p: 1.5, gap: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", alignItems: "center", gap: 2, flex: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: prod.url_imagen || "/no-image.png", alt: prod.nombre, sx: { width: 55, height: 55, objectFit: "cover", borderRadius: 2, border: "1px solid #e5e7eb" } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 500, children: prod.nombre }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["Cantidad: ", prod.cantidad] })] })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, children: ["$", Number(prod.subtotal).toLocaleString()] })] }, prod.id_producto)); }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { mt: 2, p: 1, borderRadius: 3, background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: "Total" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h6", fontWeight: 700, children: ["$", Number(detalleVenta.venta_total).toLocaleString()] })] }), detalleVenta.estado_pago != "PENDIENTE" && ((0, jsx_runtime_1.jsx)(material_1.Box, { onClick: handleLiberarMesa, sx: {
                                            mt: 3,
                                            p: 2,
                                            borderRadius: 3,
                                            background: "linear-gradient(135deg, #3d82a7, #0060e6)",
                                            color: "#fff",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            userSelect: "none",
                                            fontWeight: 700,
                                            letterSpacing: 0.5,
                                            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                            transition: "all 0.25s ease",
                                            position: "relative",
                                            overflow: "hidden",
                                            // Hover
                                            "&:hover": {
                                                transform: "translateY(-4px)",
                                                boxShadow: "0 10px 25px rgba(0, 96, 230, 0.45)",
                                            },
                                            // Click
                                            "&:active": {
                                                transform: "scale(0.96)",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                                            },
                                            // Brillo animado premium
                                            "&::after": {
                                                content: '""',
                                                position: "absolute",
                                                top: 0,
                                                left: "-100%",
                                                width: "100%",
                                                height: "100%",
                                                background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)",
                                                transition: "0.6s",
                                            },
                                            "&:hover::after": {
                                                left: "100%",
                                            },
                                        }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "LIBERAR MESA" }) })), detalleVenta.estado_pago == "PENDIENTE" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, fullWidth: true, label: "M\u00E9todo de Pago", size: "small", sx: { mt: 2 }, value: metodoPago, onChange: function (e) { return setMetodoPago(e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "EFECTIVO", children: "\uD83D\uDCB5 Efectivo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TRANSFERENCIA", children: "\uD83C\uDFE6 Transferencia" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TARJETA", children: "\uD83D\uDCB3 Tarjeta" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "PENDIENTE", children: "\u23F3 Pendiente de Pago" })] }), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, autoFocus: true, label: "Monto recibido", size: "small", type: "text", inputProps: {
                                                    inputMode: "numeric",
                                                    pattern: "[0-9]*"
                                                }, sx: { mt: 2 }, value: montoRecibido === "" ? "" : formatCOP(montoRecibido), onChange: function (e) {
                                                    var raw = e.target.value.replace(/\D/g, "");
                                                    setMontoRecibido(raw === "" ? "" : Number(raw));
                                                } })), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { mt: 1, fontWeight: 800 }, color: cambio < 0 ? "error.main" : "success.main", children: ["Cambio: ", formatCOP(cambioSeguro)] })), (0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: !(metodoPago === "EFECTIVO" && cambio < 0) ? handleFinalizarVenta : undefined, sx: {
                                                    mt: 3,
                                                    p: 2,
                                                    borderRadius: 3,
                                                    background: metodoPago === "EFECTIVO" && cambio < 0
                                                        ? "#9e9e9e"
                                                        : "linear-gradient(135deg, #09a58e, #2e7d32)",
                                                    color: "#fff",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    cursor: metodoPago === "EFECTIVO" && cambio < 0 ? "not-allowed" : "pointer",
                                                    userSelect: "none",
                                                    fontWeight: 700,
                                                    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                                    transition: "all 0.25s ease",
                                                    width: "90%",
                                                    // Responsive
                                                    fontSize: {
                                                        xs: "0.9rem",
                                                        sm: "1rem"
                                                    },
                                                    // Hover solo si está habilitado
                                                    "&:hover": metodoPago === "EFECTIVO" && cambio < 0
                                                        ? {}
                                                        : {
                                                            transform: "translateY(-4px)",
                                                            boxShadow: "0 10px 25px rgba(0,0,0,0.35)"
                                                        },
                                                    "&:active": {
                                                        transform: "scale(0.97)",
                                                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
                                                    }
                                                }, children: [(0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, {}), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, letterSpacing: 0.5, children: "PAGAR FACTURA" })] })] }))] })), !loadingDetalle && !detalleVenta && ((0, jsx_runtime_1.jsx)(material_1.Box, { textAlign: "center", py: 3, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "No hay venta activa para esta mesa." }) }))] })] })] }));
};
exports.Mesas = Mesas;
