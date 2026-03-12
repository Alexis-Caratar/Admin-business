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
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var ArrowBack_1 = require("@mui/icons-material/ArrowBack");
var Inventory_1 = require("@mui/icons-material/Inventory");
var Devices_1 = require("@mui/icons-material/Devices");
var Category_1 = require("@mui/icons-material/Category");
var framer_motion_1 = require("framer-motion");
var inventarios_1 = require("../../../api/inventarios");
var InventarioDetalles = function (_a) {
    var id = _a.id, onBack = _a.onBack;
    var _b = (0, react_1.useState)(null), data = _b[0], setData = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    (0, react_1.useEffect)(function () {
        cargar();
    }, [id]);
    var cargar = function () { return __awaiter(void 0, void 0, void 0, function () {
        var detalle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, (0, inventarios_1.getInventarioById)(id)];
                case 1:
                    detalle = _a.sent();
                    setData(detalle);
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    /** Return Professional Icon */
    var iconoTipo = function (tipo) {
        var style = { sx: { fontSize: 42, color: "#0D47A1" } };
        if (tipo === "PRODUCTOS")
            return (0, jsx_runtime_1.jsx)(Category_1.default, __assign({}, style));
        if (tipo === "ACTIVOS")
            return (0, jsx_runtime_1.jsx)(Devices_1.default, __assign({}, style));
        return (0, jsx_runtime_1.jsx)(Inventory_1.default, __assign({}, style));
    };
    if (loading)
        return ((0, jsx_runtime_1.jsx)(material_1.Box, { textAlign: "center", mt: 5, children: (0, jsx_runtime_1.jsx)(material_1.CircularProgress, {}) }));
    if (!data)
        return (0, jsx_runtime_1.jsx)(material_1.Typography, { children: "Error cargando inventario..." });
    var inventario = data.inventario, detalles = data.detalles;
    var totales = {
        coinciden: detalles.filter(function (d) { return Number(d.diferencia) === 0; }).length,
        sobrantes: detalles.filter(function (d) { return Number(d.diferencia) > 0; }).length,
        faltantes: detalles.filter(function (d) { return Number(d.diferencia) < 0; }).length,
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { p: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), onClick: onBack, sx: { mb: 2, fontWeight: "bold" }, children: "Volver" }), (0, jsx_runtime_1.jsx)(material_1.Card, { sx: {
                    borderRadius: 4,
                    mb: 3,
                    p: 2,
                    background: "linear-gradient(135deg, #E3F2FD, #FFFFFF)",
                    boxShadow: 3,
                }, children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 2, children: [iconoTipo(inventario.tipo), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", fontWeight: "bold", children: inventario.nombre }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: new Date(inventario.fecha).toLocaleString() })] })] }) }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, mb: 3, children: [
                    { label: "Coincidencias", value: totales.coinciden, color: "success.main" },
                    { label: "Sobrantes", value: totales.sobrantes, color: "info.main" },
                    { label: "Faltantes", value: totales.faltantes, color: "error.main" },
                ].map(function (item) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 16px)" // xs: full width
                    , sx: {
                        '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 16px)' }, // md: 3 por fila
                    }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                            borderRadius: 4,
                            p: 2,
                            textAlign: "center",
                            boxShadow: 2,
                        }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", children: item.label }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", color: item.color, children: item.value })] }) }, item.label)); }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { mb: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", mb: 2, fontWeight: "bold", children: "Detalles del Inventario" }), detalles.length === 0 ? ((0, jsx_runtime_1.jsx)(material_1.Typography, { children: "No existen registros." })) : (detalles.map(function (item) { return ((0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                        mb: 2,
                        p: 2,
                        borderRadius: 4,
                        boxShadow: 3,
                        bgcolor: "#F8FBFF",
                        borderLeft: "6px solid #0D47A1",
                    }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", fontWeight: "bold", children: item.nombre }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", color: "text.secondary", children: item.descripcion }), (0, jsx_runtime_1.jsxs)(material_1.Box, { mt: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: "C\u00F3digo: ".concat(item.codigo), size: "small", sx: { mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: "U.M: ".concat(item.unidad_medida), size: "small", color: "primary" })] })] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1, textAlign: "right", children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: "Sistema: ".concat(item.cantidad_sistema) }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: "F\u00EDsico: ".concat(item.cantidad_fisica) }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: "Dif: ".concat(item.diferencia), color: Number(item.diferencia) === 0
                                                ? "success"
                                                : Number(item.diferencia) > 0
                                                    ? "info"
                                                    : "error" })] })] }), item.observacion && ((0, jsx_runtime_1.jsx)(material_1.Box, { mt: 1, children: (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Observaci\u00F3n", children: (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", sx: {
                                        color: "#0D47A1",
                                        fontStyle: "italic",
                                        mt: 1,
                                    }, children: ["\uD83D\uDCDD ", item.observacion] }) }) }))] }) }, item.id)); }))] }));
};
exports.default = InventarioDetalles;
