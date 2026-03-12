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
exports.Carrito = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var AddShoppingCart_1 = require("@mui/icons-material/AddShoppingCart");
var react_swipeable_list_1 = require("react-swipeable-list");
require("react-swipeable-list/dist/styles.css");
var Person_1 = require("@mui/icons-material/Person");
var Badge_1 = require("@mui/icons-material/Badge");
var CheckCircle_1 = require("@mui/icons-material/CheckCircle");
var ShoppingBasketOutlined_1 = require("@mui/icons-material/ShoppingBasketOutlined");
var cajero_1 = require("../../../../../api/cajero");
var Close_1 = require("@mui/icons-material/Close");
// Modal para crear cliente
var CrearClienteModal_1 = require("./CrearClienteModal");
var Categorias_1 = require("./Categorias");
var Carrito = function (_a) {
    var carrito = _a.carrito, onRemove = _a.onRemove, onClear = _a.onClear, onAdd = _a.onAdd, onSub = _a.onSub, onFinalizar = _a.onFinalizar, mesaSeleccionada = _a.mesaSeleccionada, onClearMesa = _a.onClearMesa, categorias = _a.categorias, onOpenCategoria = _a.onOpenCategoria, loadingCategorias = _a.loadingCategorias;
    var _b = (0, react_1.useState)(""), clienteBuscado = _b[0], setClienteBuscado = _b[1];
    var _c = (0, react_1.useState)([]), resultados = _c[0], setResultados = _c[1];
    var _d = (0, react_1.useState)(null), clienteSeleccionado = _d[0], setClienteSeleccionado = _d[1];
    var _e = (0, react_1.useState)(false), openCrearModal = _e[0], setOpenCrearModal = _e[1];
    var _f = (0, react_1.useState)("PENDIENTE"), metodoPago = _f[0], setMetodoPago = _f[1];
    var _g = (0, react_1.useState)(""), montoRecibido = _g[0], setMontoRecibido = _g[1];
    var total = carrito.reduce(function (acc, v) { return acc + v.precio_venta * v.cantidad; }, 0);
    var monto = Number(montoRecibido) || 0;
    var cambio = monto - total;
    var cambioSeguro = Math.max(cambio, 0);
    var pagoBloqueado = metodoPago === "EFECTIVO" && cambio < 0;
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };
    var handleBuscar = function (term) { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setClienteBuscado(term);
                    if (term.trim().length < 2) {
                        setResultados([]);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, cajero_1.apibuscar_cliente)({ id_cliente: term })];
                case 1:
                    res = _a.sent();
                    setResultados(res.data.result);
                    return [2 /*return*/];
            }
        });
    }); };
    var seleccionarCliente = function (cli) {
        setClienteSeleccionado(cli);
        setResultados([]);
        setClienteBuscado("");
    };
    var trailingActions = function (id) { return ((0, jsx_runtime_1.jsx)(react_swipeable_list_1.TrailingActions, { children: (0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeAction, { destructive: true, onClick: function () { return onRemove(id); }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                    background: "#d32f2f",
                    color: "white",
                    padding: "0 20px",
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                    fontWeight: "bold",
                }, children: "Eliminar" }) }) })); };
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)(material_1.Card, { sx: { p: 2, borderRadius: 2, mb: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 1, mb: 1, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { color: "primary" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 16, children: "Cliente" })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, size: "small", placeholder: "Buscar por identificaci\u00F3n o nombres", value: clienteBuscado, onChange: function (e) { return handleBuscar(e.target.value); }, InputProps: {
                                startAdornment: ((0, jsx_runtime_1.jsx)(Person_1.default, { sx: { mr: 1, color: "text.secondary" } })),
                            } }), resultados.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { mt: 1, maxHeight: 150, overflowY: "auto" }, children: resultados.map(function (cli) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                    p: 1,
                                    cursor: "pointer",
                                    borderRadius: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.2,
                                    "&:hover": { backgroundColor: "#f0f4ff" },
                                }, onClick: function () { return seleccionarCliente(cli); }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "primary.main", width: 32, height: 32 }, children: cli.nombres[0] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, fontSize: 11, children: [cli.nombres, " ", cli.apellidos] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 0.5,
                                                }, children: [(0, jsx_runtime_1.jsx)(Badge_1.default, { sx: { fontSize: 14, color: "text.secondary" } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", color: "text.secondary", children: cli.identificacion })] })] })] }, cli.id)); }) })), clienteSeleccionado && ((0, jsx_runtime_1.jsxs)(material_1.Box, { mt: 2, p: 1.5, sx: {
                                background: "linear-gradient(135deg, #e8f5e9, #f1fff5)",
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                border: "1px solid #c8e6c9",
                            }, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { sx: { fontSize: 30, color: "primary.main" } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, fontSize: 12, children: [clienteSeleccionado.nombres, " ", clienteSeleccionado.apellidos] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", alignItems: "center", gap: 0.5 }, children: [(0, jsx_runtime_1.jsx)(Badge_1.default, { sx: { fontSize: 15, color: "text.secondary" } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: clienteSeleccionado.identificacion })] })] }), (0, jsx_runtime_1.jsx)(CheckCircle_1.default, { sx: { fontSize: 30, color: "#2ecc71" } })] })), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", fullWidth: true, sx: { mt: 2 }, onClick: function () { return setOpenCrearModal(true); }, children: "Crear Cliente / Empresa" })] }), (0, jsx_runtime_1.jsx)(CrearClienteModal_1.CrearClienteModal, { open: openCrearModal, onClose: function () { return setOpenCrearModal(false); }, onCreated: function (nuevo) {
                        var clienteFinal = __assign(__assign({}, nuevo), { id: Date.now() });
                        setClienteSeleccionado(clienteFinal);
                        setOpenCrearModal(false);
                    } }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", mb: 1, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 1, children: [(0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, { color: "primary" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", children: "Carrito de Ventas" })] }), carrito.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", color: "error", variant: "outlined", onClick: onClear, sx: {
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600
                            }, children: "Vaciar carrito" }))] }), mesaSeleccionada && ((0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        background: "linear-gradient(135deg, #e3f2fd, #f1f8ff)",
                        border: "1px solid #bbdefb",
                    }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: {
                                bgcolor: "primary.main",
                                width: 42,
                                height: 42,
                            }, children: "\uD83E\uDE91" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 13, children: "Mesa seleccionada" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 14, color: "text.secondary", children: [mesaSeleccionada.nombre, " \u00B7 Capacidad ", mesaSeleccionada.capacidad] })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", alignItems: "center", gap: 0.5 }, children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: mesaSeleccionada.estado, color: mesaSeleccionada.estado === "Disponible"
                                        ? "success"
                                        : mesaSeleccionada.estado === "Ocupada"
                                            ? "error"
                                            : "warning", size: "small", sx: { fontWeight: 600 } }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", sx: {
                                        bgcolor: "rgba(0,0,0,0.05)",
                                        "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
                                    }, onClick: onClearMesa, children: (0, jsx_runtime_1.jsx)(Close_1.default, { fontSize: "small" }) })] })] })), (0, jsx_runtime_1.jsx)(material_1.Card, { sx: { p: 1, borderRadius: 2, boxShadow: 3 }, children: carrito.length === 0 ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", px: 1, py: 4, align: "center", children: "No hay productos." }), (0, jsx_runtime_1.jsx)(Categorias_1.Categorias, { categorias: categorias, loading: loadingCategorias, onOpen: onOpenCategoria, modo: "carrito" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { color: "text.secondary", align: "left", sx: { display: "flex", alignItems: "center", gap: 1 }, children: [(0, jsx_runtime_1.jsx)(ShoppingBasketOutlined_1.default, { fontSize: "small" }), "Productos"] }), (0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeableList, { children: carrito.map(function (item) { return ((0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeableListItem, { trailingActions: trailingActions(item.id), children: (0, jsx_runtime_1.jsxs)(material_1.ListItem, { sx: {
                                            py: 1,
                                            "&:hover": {
                                                backgroundColor: "#f5f5f5",
                                                borderRadius: 1,
                                            },
                                        }, children: [(0, jsx_runtime_1.jsx)(material_1.ListItemAvatar, { children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { src: item.imagen_plato, alt: item.nombre, variant: "rounded", sx: { width: 50, height: 50, mr: 1 } }) }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, fontWeight: 600, children: item.nombre }), secondary: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 0.5, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", size: "small", onClick: function () { return onSub(item.id); }, sx: { minWidth: 24, padding: "2px" }, children: "-" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, fontWeight: 600, children: item.cantidad }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", size: "small", onClick: function () { return onAdd(item.id); }, sx: { minWidth: 24, padding: "2px" }, children: "+" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: ["\uD83D\uDCB2 ", item.precio_venta.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, fontWeight: "bold", color: "primary", children: ["Subtotal: $", (item.cantidad * item.precio_venta).toLocaleString()] })] }) })] }) }, item.id)); }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 1 } }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", fontSize: 16, children: "Total" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: "bold", color: "success.main", fontSize: 16, children: ["$", total.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, fullWidth: true, label: "M\u00E9todo de Pago", size: "small", sx: { mt: 2 }, value: metodoPago, onChange: function (e) { return setMetodoPago(e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "PENDIENTE", children: "\u23F3 Pendiente de Pago" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "EFECTIVO", children: "\uD83D\uDCB5 Efectivo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TRANSFERENCIA", children: "\uD83C\uDFE6 Transferencia" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TARJETA", children: "\uD83D\uDCB3 Tarjeta" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "NEQUI", children: "\uD83D\uDCF1 Nequi" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "DAVIPLATA", children: "\uD83C\uDFE6 DaviPlata" })] }), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Monto recibido", size: "small", type: "text", sx: { mt: 2 }, value: montoRecibido === "" ? "" : formatCOP(montoRecibido), onChange: function (e) {
                                    // Limpia todo excepto números
                                    var raw = e.target.value.replace(/\D/g, "");
                                    setMontoRecibido(raw === "" ? "" : Number(raw));
                                }, InputProps: {
                                    startAdornment: ((0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { mr: 1, fontWeight: 600 } })),
                                } })), montoRecibido !== "" && cambio < 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "error", variant: "caption", children: "El monto recibido es menor al total" })), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { mt: 1 }, fontWeight: 800, color: cambio < 0 ? "error.main" : "success.main", children: ["Cambio: ", formatCOP(cambioSeguro)] })), (0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: !pagoBloqueado
                                    ? function () {
                                        var _a;
                                        onFinalizar((_a = clienteSeleccionado === null || clienteSeleccionado === void 0 ? void 0 : clienteSeleccionado.id) !== null && _a !== void 0 ? _a : null, {
                                            metodo_pago: metodoPago,
                                            monto_recibido: montoRecibido,
                                            cambio: Math.max(cambio, 0),
                                        });
                                        setClienteSeleccionado(null);
                                        setClienteBuscado("");
                                        setResultados([]);
                                        setMetodoPago("EFECTIVO");
                                        setMontoRecibido(0);
                                    }
                                    : undefined, sx: {
                                    mt: 2,
                                    p: 2,
                                    borderRadius: 3,
                                    background: pagoBloqueado
                                        ? "#9e9e9e"
                                        : "linear-gradient(135deg,#09a58e,#2e7d32)",
                                    color: "#fff",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 1.2,
                                    cursor: pagoBloqueado ? "not-allowed" : "pointer",
                                    userSelect: "none",
                                    fontWeight: 700,
                                    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                    transition: "all 0.25s ease",
                                    width: "90%",
                                    fontSize: {
                                        xs: "0.95rem",
                                        sm: "1rem",
                                    },
                                    "&:hover": pagoBloqueado
                                        ? {}
                                        : {
                                            transform: "translateY(-4px)",
                                            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                                        },
                                    "&:active": {
                                        transform: "scale(0.97)",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                                    },
                                }, children: [(0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, {}), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, letterSpacing: 0.5, children: "FINALIZAR VENTA" })] })] })) })] }) }));
};
exports.Carrito = Carrito;
