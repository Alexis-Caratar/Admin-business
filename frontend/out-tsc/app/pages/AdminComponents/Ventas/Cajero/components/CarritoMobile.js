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
exports.CarritoMobile = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
// CarritoMobile.tsx
var react_1 = require("react");
var material_1 = require("@mui/material");
var AddShoppingCart_1 = require("@mui/icons-material/AddShoppingCart");
var Close_1 = require("@mui/icons-material/Close");
var Delete_1 = require("@mui/icons-material/Delete");
var Person_1 = require("@mui/icons-material/Person");
var Badge_1 = require("@mui/icons-material/Badge");
var CheckCircle_1 = require("@mui/icons-material/CheckCircle");
var Payment_1 = require("@mui/icons-material/Payment");
var framer_motion_1 = require("framer-motion");
var CrearClienteModal_1 = require("./CrearClienteModal");
var Categorias_1 = require("./Categorias");
var cajero_1 = require("../../../../../api/cajero");
var react_swipeable_list_1 = require("react-swipeable-list");
require("react-swipeable-list/dist/styles.css");
var slideVariants = {
    enter: function (direction) { return ({
        x: direction > 0 ? 160 : -160,
        opacity: 0,
    }); },
    center: {
        x: 0,
        opacity: 1,
    },
    exit: function (direction) { return ({
        x: direction > 0 ? -160 : 160,
        opacity: 0,
    }); },
};
var CarritoMobile = function (_a) {
    var open = _a.open, onClose = _a.onClose, carrito = _a.carrito, onRemove = _a.onRemove, onClear = _a.onClear, onAdd = _a.onAdd, onSub = _a.onSub, onFinalizar = _a.onFinalizar, mesaSeleccionada = _a.mesaSeleccionada, onClearMesa = _a.onClearMesa, categorias = _a.categorias, onOpenCategoria = _a.onOpenCategoria, loadingCategorias = _a.loadingCategorias;
    var _b = (0, react_1.useState)(0), tab = _b[0], setTab = _b[1];
    var _c = (0, react_1.useState)(1), direction = _c[0], setDirection = _c[1];
    // CLIENTE
    var _d = (0, react_1.useState)(""), clienteBuscado = _d[0], setClienteBuscado = _d[1];
    var _e = (0, react_1.useState)([]), resultados = _e[0], setResultados = _e[1];
    var _f = (0, react_1.useState)(null), clienteSeleccionado = _f[0], setClienteSeleccionado = _f[1];
    var _g = (0, react_1.useState)(false), openCrearModal = _g[0], setOpenCrearModal = _g[1];
    var _h = (0, react_1.useState)(0), resetCliente = _h[0], setResetCliente = _h[1];
    // PAGO
    var total = carrito.reduce(function (acc, v) { return acc + v.precio_venta * v.cantidad; }, 0);
    var _j = (0, react_1.useState)("PENDIENTE"), metodoPago = _j[0], setMetodoPago = _j[1];
    var _k = (0, react_1.useState)(0), montoRecibido = _k[0], setMontoRecibido = _k[1];
    var cambio = montoRecibido - total;
    var trailingActions = function (id) { return ((0, jsx_runtime_1.jsx)(react_swipeable_list_1.TrailingActions, { children: (0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeAction, { destructive: true, onClick: function () { return onRemove(id); }, children: (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    height: "100%",
                    background: "#e53935",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    px: 3,
                    borderRadius: 2,
                }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) }) }) })); };
    (0, react_1.useEffect)(function () {
        if (carrito.length === 0) {
            setClienteSeleccionado(null);
            setMetodoPago("PENDIENTE");
            setMontoRecibido(0);
        }
    }, [carrito]);
    (0, react_1.useEffect)(function () {
        if (open) {
            setTab(0);
            setDirection(1);
        }
    }, [open]);
    (0, react_1.useEffect)(function () {
        if (open) {
            setTab(0);
            setDirection(1);
        }
    }, [open]);
    // Buscar cliente (llamada a la API)
    var handleBuscar = function (term) { return __awaiter(void 0, void 0, void 0, function () {
        var res, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setClienteBuscado(term);
                    if (term.trim().length < 2) {
                        setResultados([]);
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, cajero_1.apibuscar_cliente)({ id_cliente: term })];
                case 2:
                    res = _c.sent();
                    // ajustar según la forma en que tu API responde
                    setResultados((_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : []);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _c.sent();
                    console.error("Error buscar cliente:", err_1);
                    setResultados([]);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var seleccionarCliente = function (cli) {
        setClienteSeleccionado(cli);
        setResultados([]);
        setClienteBuscado("");
    };
    // Cambiar tab con animación; dir = 1 (forward), -1 (back)
    var goToTab = function (newTab) {
        setDirection(newTab > tab ? 1 : -1);
        setTab(newTab);
    };
    // Manejo de "pan" (swipe) sobre el panel animado
    var handlePanEnd = function (_, info) {
        var offsetX = info.offset.x;
        if (offsetX < -80 && tab < 1) {
            goToTab(tab + 1);
        }
        else if (offsetX > 80 && tab > 0) {
            goToTab(tab - 1);
        }
    };
    // Finalizar: llamar al padre y resetear estados
    var handleFinalizar = function () {
        if (carrito.length === 0)
            return;
        var pago = {
            metodo_pago: metodoPago,
            monto_recibido: montoRecibido,
            cambio: Math.max(cambio, 0),
        };
        onFinalizar(clienteSeleccionado ? clienteSeleccionado.id : null, pago);
        onClear();
        toastr.success("Venta registrada correctamente");
        // Reset states
        setClienteSeleccionado(null);
        setClienteBuscado("");
        setResultados([]);
        setResetCliente(function (prev) { return prev + 1; });
        setMetodoPago("EFECTIVO");
        setMontoRecibido(0);
        onClose();
        setTab(0);
        setDirection(1);
    };
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Drawer, { anchor: "bottom", open: open, onClose: onClose, ModalProps: {
                    keepMounted: false
                }, sx: {
                    //zIndex: 1800, // ⬅️ Más alto que cualquier modal/overlay normal
                    "& .MuiBackdrop-root": {
                        backgroundColor: "rgba(0,0,0,0.2)", // Más elegante
                    },
                }, PaperProps: {
                    sx: {
                        zIndex: 1801, // ⬅️ El paper SIEMPRE debe estar por encima del backdrop
                        borderTopLeftRadius: 22,
                        borderTopRightRadius: 22,
                        height: "87vh",
                        p: 1.6,
                        overflow: "hidden",
                        boxShadow: "0px -4px 18px rgba(0,0,0,0.18)", // sombra superior profesional
                        background: "#fff", // blanco limpio
                    },
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", mb: 1, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 1, children: [(0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, { color: "primary" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", children: "Carrito de Ventas" })] }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: onClose, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) }), carrito.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", color: "error", variant: "outlined", onClick: onClear, sx: {
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
                                                        : "warning", size: "small", sx: { fontWeight: 600 } }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", onClick: onClearMesa, sx: {
                                                    bgcolor: "#f5f5f5",
                                                    "&:hover": { bgcolor: "#e0e0e0" },
                                                }, children: (0, jsx_runtime_1.jsx)(Close_1.default, { fontSize: "small" }) })] })] })), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", width: "100%", children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: tab === 0 ? "contained" : "outlined", startIcon: (0, jsx_runtime_1.jsx)(Person_1.default, {}), onClick: function () { return goToTab(0); }, sx: {
                                            flex: 1,
                                            textTransform: "none",
                                            borderRadius: 2,
                                            py: 1,
                                            fontWeight: 500,
                                        }, children: "Cliente & Pedido" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: tab === 1 ? "contained" : "outlined", startIcon: (0, jsx_runtime_1.jsx)(Payment_1.default, {}), onClick: function () { return goToTab(1); }, sx: {
                                            flex: 1,
                                            textTransform: "none",
                                            borderRadius: 2,
                                            py: 1,
                                            fontWeight: 400,
                                        }, children: "Pago" })] })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { mb: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { position: "relative", height: "calc(85vh - 120px)" }, children: (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { custom: direction, mode: "wait", children: (0, jsx_runtime_1.jsxs)(framer_motion_1.motion.div, { custom: direction, variants: slideVariants, initial: "enter", animate: "center", exit: "exit", transition: { type: "spring", stiffness: 260, damping: 24 }, style: { position: "absolute", width: "100%", top: 0, left: 0 }, drag: tab === 1 ? "x" : false, dragConstraints: { left: 0, right: 0 }, onDragEnd: function (_, info) {
                                    if (tab === 1)
                                        handlePanEnd(_, info);
                                }, children: [tab === 0 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { px: 0.5 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, placeholder: "Buscar por identificaci\u00F3n o nombres", size: "small", value: clienteBuscado, onChange: function (e) { return handleBuscar(e.target.value); } }, resetCliente), resultados.length > 0 && ((0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { mt: 1, maxHeight: 160, overflowY: "auto" }, children: resultados.map(function (cli) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                        p: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                        cursor: "pointer",
                                                        "&:hover": { background: "#f4f7ff" },
                                                    }, onClick: function () { return seleccionarCliente(cli); }, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { sx: { fontSize: 26, color: "primary.main" } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, fontWeight: 600, children: [cli.nombres, " ", cli.apellidos] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 0.5, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(Badge_1.default, { sx: { fontSize: 14 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", children: cli.identificacion })] })] })] }, cli.id)); }) })), clienteSeleccionado && ((0, jsx_runtime_1.jsxs)(material_1.Box, { mt: 2, p: 1.25, sx: {
                                                    background: "#e8f5e9",
                                                    borderRadius: 2,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1.25,
                                                    border: "1px solid #c8e6c9",
                                                }, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { sx: { fontSize: 30, color: "primary.main" } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, fontSize: 13, children: [clienteSeleccionado.nombres, " ", clienteSeleccionado.apellidos] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 0.5, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(Badge_1.default, { sx: { fontSize: 14 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: clienteSeleccionado.identificacion })] })] }), (0, jsx_runtime_1.jsx)(CheckCircle_1.default, { sx: { fontSize: 28, color: "#2ecc71" } })] })), (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, variant: "outlined", sx: { mt: 2 }, onClick: function () { return setOpenCrearModal(true); }, children: "Crear Cliente / Empresa" }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { maxHeight: "38vh", overflowY: "auto", scrollbarWidth: "thin" }, children: carrito.length === 0 ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", px: 1, py: 4, align: "center", children: "No hay productos." }), (0, jsx_runtime_1.jsx)(Categorias_1.Categorias, { categorias: categorias, loading: loadingCategorias, onOpen: onOpenCategoria, modo: "carrito" })] })) : ((0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeableList, { threshold: 0.25, children: carrito.map(function (item) {
                                                        var _a;
                                                        return ((0, jsx_runtime_1.jsx)(react_swipeable_list_1.SwipeableListItem, { trailingActions: trailingActions(item.id), children: (0, jsx_runtime_1.jsxs)(material_1.ListItem, { sx: { py: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.ListItemAvatar, { children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { src: (_a = item.imagen_plato) !== null && _a !== void 0 ? _a : undefined, variant: "rounded", sx: { width: 48, height: 48 } }) }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: item.nombre }), secondary: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", variant: "outlined", onClick: function () { return onSub(item.id); }, sx: { minWidth: 30 }, children: "-" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", children: item.cantidad }), (0, jsx_runtime_1.jsx)(material_1.Button, { size: "small", variant: "outlined", onClick: function () { return onAdd(item.id); }, sx: { minWidth: 30 }, children: "+" })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { color: "primary", children: ["Subtotal: $", (item.precio_venta * item.cantidad).toLocaleString()] })] }) })] }) }, item.id));
                                                    }) })) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                    position: "sticky",
                                                    bottom: 0,
                                                    background: "#fff",
                                                    borderTop: "1px solid #eee",
                                                    pt: 1,
                                                    pb: 1,
                                                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", children: "Total" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", color: "success.main", children: formatCOP(total) })] }), (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, variant: "contained", onClick: function () { return goToTab(1); }, disabled: carrito.length === 0, sx: {
                                                            mt: 1.2,
                                                            py: 1.4,
                                                            borderRadius: 3,
                                                            fontWeight: "bold",
                                                            fontSize: 15,
                                                            letterSpacing: 0.5,
                                                            textTransform: "none",
                                                            background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                                                            boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
                                                            transition: "all .25s ease",
                                                            "&:hover": {
                                                                background: "linear-gradient(135deg, #0bb79d, #388e3c)",
                                                                transform: "translateY(-2px)",
                                                                boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
                                                            },
                                                            "&:active": {
                                                                transform: "scale(0.97)",
                                                            },
                                                            "&.Mui-disabled": {
                                                                background: "#cfcfcf",
                                                                color: "#888",
                                                                boxShadow: "none",
                                                            },
                                                        }, children: "Ir a Pago" })] })] })), tab === 1 && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { px: 0.5 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, mb: 1, children: ["Total a Pagar: $", total.toLocaleString()] }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, fullWidth: true, size: "small", label: "M\u00E9todo de Pago", value: metodoPago, sx: { mt: 1 }, onChange: function (e) { return setMetodoPago(e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "PENDIENTE", children: "\u23F3 Pendiente de Pago" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "EFECTIVO", children: "\uD83D\uDCB5 Efectivo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TRANSFERENCIA", children: "\uD83C\uDFE6 Transferencia" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TARJETA", children: "\uD83D\uDCB3 Tarjeta" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "NEQUI", children: "\uD83D\uDCF1 Nequi" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "DAVIPLATA", children: "\uD83C\uDFE6 DaviPlata" })] }), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, size: "small", label: "Monto recibido", type: "number", sx: { mt: 2 }, value: montoRecibido === 0 ? "" : montoRecibido, onChange: function (e) {
                                                    var val = Number(e.target.value);
                                                    setMontoRecibido(isNaN(val) ? 0 : val);
                                                } })), metodoPago === "EFECTIVO" && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { mt: 1 }, fontWeight: "bold", color: cambio < 0 ? "error.main" : "success.main", children: ["Cambio: $", Math.max(cambio, 0).toLocaleString()] })), (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(CheckCircle_1.default, {}), sx: {
                                                    mt: 3,
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    fontWeight: "bold",
                                                    fontSize: 16,
                                                    letterSpacing: 0.6,
                                                    textTransform: "none",
                                                    background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                                                    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                                                    transition: "all .25s ease",
                                                    "&:hover": {
                                                        background: "linear-gradient(135deg, #0bb79d, #388e3c)",
                                                        transform: "translateY(-2px)",
                                                        boxShadow: "0 12px 24px rgba(0,0,0,0.22)",
                                                    },
                                                    "&:active": {
                                                        transform: "scale(0.97)",
                                                    },
                                                    "&.Mui-disabled": {
                                                        background: "#d6d6d6",
                                                        color: "#888",
                                                        boxShadow: "none",
                                                    },
                                                }, disabled: carrito.length === 0 ||
                                                    (metodoPago === "EFECTIVO" && cambio < 0), onClick: handleFinalizar, children: "Finalizar Venta" })] }))] }, tab) }) })] }), (0, jsx_runtime_1.jsx)(CrearClienteModal_1.CrearClienteModal, { open: openCrearModal, onClose: function () { return setOpenCrearModal(false); }, onCreated: function (nuevo) {
                    setClienteSeleccionado(__assign(__assign({}, nuevo), { id: Date.now() }));
                    setOpenCrearModal(false);
                } })] }));
};
exports.CarritoMobile = CarritoMobile;
