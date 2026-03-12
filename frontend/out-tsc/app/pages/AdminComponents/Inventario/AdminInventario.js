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
var Add_1 = require("@mui/icons-material/Add");
var Delete_1 = require("@mui/icons-material/Delete");
var ExpandMore_1 = require("@mui/icons-material/ExpandMore");
var Inventory_1 = require("@mui/icons-material/Inventory");
var Devices_1 = require("@mui/icons-material/Devices");
var ShoppingCart_1 = require("@mui/icons-material/ShoppingCart");
var sweetalert2_1 = require("sweetalert2");
var framer_motion_1 = require("framer-motion");
var inventarios_1 = require("../../../api/inventarios");
var DetalleInventario_1 = require("./DetalleInventario");
var AdminInventario = function () {
    var idNegocio = localStorage.getItem("id_negocio") || "";
    var idPersona = localStorage.getItem("id_persona") || "";
    var _a = (0, react_1.useState)([]), inventarios = _a[0], setInventarios = _a[1];
    var _b = (0, react_1.useState)(false), openModal = _b[0], setOpenModal = _b[1];
    var _c = (0, react_1.useState)(null), detalleId = _c[0], setDetalleId = _c[1];
    var _d = (0, react_1.useState)({
        nombre: "",
        tipo: "PRODUCTOS",
        id_negocio: idNegocio,
        id_persona: idPersona,
    }), form = _d[0], setForm = _d[1];
    // Obtener inventarios
    var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, inventarios_1.getInventarios)()];
                case 1:
                    data = _a.sent();
                    setInventarios(data);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchData();
    }, []);
    // Crear inventario
    /*   const handleSubmit = async () => {
        await crearInventario(form);
        setOpenModal(false);
        setForm({ nombre: "", tipo: "PRODUCTOS", id_negocio: idNegocio, id_persona: idPersona });
        fetchData();
      }; */
    // Eliminar inventario
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sweetalert2_1.default.fire({
                        title: "¿Eliminar inventario?",
                        text: "Esta acción no se puede deshacer.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3085d6",
                        confirmButtonText: "Sí, eliminar",
                    })];
                case 1:
                    result = _a.sent();
                    if (!result.isConfirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, inventarios_1.deleteInventario)(id)];
                case 2:
                    _a.sent();
                    fetchData();
                    sweetalert2_1.default.fire({ icon: "success", title: "Inventario eliminado", timer: 1500 });
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Icono según tipo
    var iconoTipo = function (tipo) {
        if (tipo === "PRODUCTOS")
            return (0, jsx_runtime_1.jsx)(ShoppingCart_1.default, { sx: { fontSize: 32, color: "#19786aff" } });
        if (tipo === "ACTIVOS")
            return (0, jsx_runtime_1.jsx)(Devices_1.default, { sx: { fontSize: 32, color: "#184384ff" } });
        return (0, jsx_runtime_1.jsx)(Inventory_1.default, { sx: { fontSize: 32, color: "#176291ff" } });
    };
    var tituloTipo = function (tipo) {
        if (tipo === "PRODUCTOS")
            return "Productos";
        if (tipo === "ACTIVOS")
            return " Activos";
        return " Otros";
    };
    if (detalleId) {
        return (0, jsx_runtime_1.jsx)(DetalleInventario_1.default, { id: detalleId, onBack: function () { return setDetalleId(null); } });
    }
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { p: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", mb: 3, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(Inventory_1.default, {}), " Inventario F\u00EDsico"] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(Add_1.default, {}), onClick: function () { return setOpenModal(true); }, sx: { background: "#0D47A1" }, children: "Crear Inventario" })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, children: inventarios.map(function (inv) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 16px)" // xs: 1 por fila
                    , sx: {
                        '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 16px)' }, // md: 3 por fila
                    }, children: (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: (0, jsx_runtime_1.jsx)(material_1.Card, { onClick: function () { return setDetalleId(inv.id); }, sx: {
                                borderRadius: 3,
                                boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                                cursor: "pointer", // 👈 MOUSE POINTER
                                transition: "0.2s",
                                "&:hover": {
                                    boxShadow: "0px 6px 18px rgba(0,0,0,0.18)",
                                    transform: "translateY(-3px)",
                                },
                                position: "relative",
                            }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [iconoTipo(inv.tipo), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: tituloTipo(inv.tipo) })] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", sx: { mt: 1 }, children: inv.nombre }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "caption", color: "text.secondary", children: ["Fecha: ", new Date(inv.fecha).toLocaleString()] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, mt: 2, children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "error", onClick: function (e) {
                                                    e.stopPropagation(); // 🔒 EVITA QUE SE ABRA LA TARJETA
                                                    handleDelete(inv.id);
                                                }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: function (e) {
                                                    e.stopPropagation(); // 🔒 EVITA QUE SE ABRA LA TARJETA
                                                    setDetalleId(inv.id);
                                                }, children: (0, jsx_runtime_1.jsx)(ExpandMore_1.default, {}) })] })] }) }) }) }, inv.id)); }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openModal, onClose: function () { return setOpenModal(false); }, fullWidth: true, maxWidth: "sm", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Nuevo Inventario F\u00EDsico" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombre del inventario", value: form.nombre, onChange: function (e) { return setForm(__assign(__assign({}, form), { nombre: e.target.value })); } }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, { fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Tipo" }), (0, jsx_runtime_1.jsxs)(material_1.Select, { value: form.tipo, label: "Tipo", onChange: function (e) { return setForm(__assign(__assign({}, form), { tipo: e.target.value })); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "PRODUCTOS", children: "Productos" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "ACTIVOS", children: "Activos" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "OTROS", children: "Otros" })] })] })] })] })] }));
};
exports.default = AdminInventario;
