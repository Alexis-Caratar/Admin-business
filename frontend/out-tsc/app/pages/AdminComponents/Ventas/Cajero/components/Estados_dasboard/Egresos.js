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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Egresos;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var Add_1 = require("@mui/icons-material/Add");
var DeleteOutline_1 = require("@mui/icons-material/DeleteOutline");
var EditOutlined_1 = require("@mui/icons-material/EditOutlined");
var Close_1 = require("@mui/icons-material/Close");
var PaymentsOutlined_1 = require("@mui/icons-material/PaymentsOutlined");
var AddCircleOutline_1 = require("@mui/icons-material/AddCircleOutline");
var react_1 = require("react");
var Collapse_1 = require("@mui/material/Collapse");
var cajero_1 = require("../../../../../../api/cajero");
function Egresos(_a) {
    var _this = this;
    var idUsuario = _a.idUsuario, id_negocio = _a.id_negocio, id_caja = _a.id_caja, open = _a.open, onClose = _a.onClose;
    var _b = (0, react_1.useState)(""), descripcion = _b[0], setDescripcion = _b[1];
    var _c = (0, react_1.useState)("EFECTIVO"), metodo_pago = _c[0], setMetodoPago = _c[1];
    var _d = (0, react_1.useState)(""), monto = _d[0], setMonto = _d[1];
    var _e = (0, react_1.useState)(""), observacion = _e[0], setObservacion = _e[1];
    var _f = (0, react_1.useState)([]), egresos = _f[0], setEgresos = _f[1];
    var _g = (0, react_1.useState)(null), editId = _g[0], setEditId = _g[1];
    var _h = (0, react_1.useState)(false), showForm = _h[0], setShowForm = _h[1];
    // Estados para dialogo de confirmación
    var _j = (0, react_1.useState)(false), openConfirm = _j[0], setOpenConfirm = _j[1];
    var _k = (0, react_1.useState)(null), deleteId = _k[0], setDeleteId = _k[1];
    console.log("id_usuario", idUsuario);
    (0, react_1.useEffect)(function () {
        if (!open)
            return;
        cargarEgresos();
    }, [open, id_negocio, id_caja]);
    var cargarEgresos = function () { return __awaiter(_this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Si cualquiera es null, no hacemos la llamada
                    if (id_negocio === null || id_caja === null)
                        return [2 /*return*/];
                    return [4 /*yield*/, (0, cajero_1.egresosListar)(id_negocio, id_caja)];
                case 1:
                    data = _a.sent();
                    setEgresos(data);
                    return [2 /*return*/];
            }
        });
    }); };
    var total = (0, react_1.useMemo)(function () {
        return egresos.reduce(function (acc, e) { return acc + Number(e.monto); }, 0);
    }, [egresos]);
    var limpiar = function () {
        setDescripcion("");
        setMetodoPago("EFECTIVO");
        setMonto("");
        setObservacion("");
        setEditId(null);
    };
    var formatCOP = function (value) {
        if (!value)
            return "";
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(Number(value));
    };
    var handleGuardar = function () { return __awaiter(_this, void 0, void 0, function () {
        var payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!descripcion || !monto)
                        return [2 /*return*/];
                    payload = { idUsuario: idUsuario, id_negocio: id_negocio, id_caja: id_caja, descripcion: descripcion, metodo_pago: metodo_pago, monto: monto, observacion: observacion };
                    if (!editId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, cajero_1.egresoActualizar)(editId, payload)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, cajero_1.egresoCrear)(payload)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, cargarEgresos()];
                case 5:
                    _a.sent();
                    limpiar();
                    setShowForm(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleConfirmDelete = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!deleteId)
                        return [2 /*return*/];
                    return [4 /*yield*/, (0, cajero_1.egresoEliminar)(deleteId)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, cargarEgresos()];
                case 2:
                    _a.sent();
                    setOpenConfirm(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "lg", PaperProps: { sx: { borderRadius: 4 } }, children: (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { p: 4 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mb: 3, sx: {
                                pb: 2,
                                borderBottom: "1px solid #f1f5f9"
                            }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                width: 42,
                                                height: 42,
                                                borderRadius: 2,
                                                bgcolor: "#fee2e2",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center"
                                            }, children: (0, jsx_runtime_1.jsx)(PaymentsOutlined_1.default, { sx: { color: "#dc2626" } }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 18, children: "Egresos de Caja" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", color: "text.secondary", children: "Registro y control de salidas de dinero" })] })] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: showForm ? (0, jsx_runtime_1.jsx)(Close_1.default, {}) : (0, jsx_runtime_1.jsx)(AddCircleOutline_1.default, {}), sx: {
                                        borderRadius: 3,
                                        textTransform: "none",
                                        fontWeight: 600,
                                        px: 3
                                    }, onClick: function () { return setShowForm(!showForm); }, children: showForm ? "" : "Ingresar egreso" })] }), (0, jsx_runtime_1.jsx)(Collapse_1.default, { in: showForm, timeout: 300, unmountOnExit: true, children: (0, jsx_runtime_1.jsx)(material_1.Card, { elevation: 0, sx: {
                                    mb: 4,
                                    borderRadius: 3,
                                    border: "1px solid #f0f0f0",
                                    transition: "all .25s ease"
                                }, children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 3, children: (0, jsx_runtime_1.jsx)(material_1.Card, { elevation: 0, sx: { mb: 4, borderRadius: 3, border: "1px solid #f0f0f0" }, children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 3, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "CONCEPTO DE EGRESO", value: descripcion, onChange: function (e) { return setDescripcion(e.target.value); }, fullWidth: true, size: "small" }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: { xs: "column", md: "row" }, spacing: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, fullWidth: true, label: "M\u00E9todo de Pago", size: "small", value: metodo_pago, onChange: function (e) { return setMetodoPago(e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "EFECTIVO", children: "\uD83D\uDCB5 Efectivo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TRANSFERENCIA", children: "\uD83C\uDFE6 Transferencia" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "TARJETA", children: "\uD83D\uDCB3 Tarjeta" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "NEQUI", children: "\uD83D\uDCF1 Nequi" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "DAVIPLATA", children: "\uD83C\uDFE6 DaviPlata" })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Monto", value: monto === "" ? "" : formatCOP(monto), onChange: function (e) {
                                                                        var raw = e.target.value.replace(/\D/g, "");
                                                                        setMonto(raw === "" ? "" : Number(raw));
                                                                    }, fullWidth: true, size: "small" })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Observaci\u00F3n", value: observacion, onChange: function (e) { return setObservacion(e.target.value); }, fullWidth: true, size: "small", multiline: true, rows: 2 }), (0, jsx_runtime_1.jsx)(material_1.Box, { textAlign: "right", children: (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(Add_1.default, {}), sx: { borderRadius: 3, px: 4, textTransform: "none", fontWeight: 600 }, onClick: handleGuardar, children: editId ? "Actualizar" : "Registrar Egreso" }) })] }) }) }) }) }) }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                borderRadius: 3,
                                border: "1px solid #e5e7eb",
                                overflow: "hidden",
                                bgcolor: "#fff"
                            }, children: [egresos.length === 0 && ((0, jsx_runtime_1.jsx)(material_1.Box, { textAlign: "center", py: 4, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", children: "No hay egresos registrados" }) })), egresos.map(function (e, index) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        px: 2,
                                        py: 1.4,
                                        borderBottom: index !== egresos.length - 1 ? "1px dashed #e5e7eb" : "none",
                                        transition: "all .2s",
                                        "&:hover": {
                                            bgcolor: "#f9fafb"
                                        }
                                    }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Chip, { label: e.numero_egreso, size: "small", sx: {
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                height: 20,
                                                                bgcolor: "#111827",
                                                                color: "#fff"
                                                            } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, fontWeight: 600, children: e.descripcion })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "caption", color: "text.secondary", children: [e.metodo_pago, e.observacion && " \u2022 ".concat(e.observacion)] })] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 700, color: "error.main", fontSize: 15, children: ["-", formatCOP(e.monto)] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { orientation: "vertical", flexItem: true }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", onClick: function () {
                                                        setEditId(e.id);
                                                        setDescripcion(e.descripcion);
                                                        setMetodoPago(e.metodo_pago);
                                                        setMonto(e.monto);
                                                        setObservacion(e.observacion);
                                                        // Abrir el formulario automáticamente
                                                        setShowForm(true);
                                                    }, children: (0, jsx_runtime_1.jsx)(EditOutlined_1.default, { sx: { fontSize: 18 } }) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", color: "error", onClick: function () {
                                                        setDeleteId(e.id);
                                                        setOpenConfirm(true);
                                                    }, children: (0, jsx_runtime_1.jsx)(DeleteOutline_1.default, { sx: { fontSize: 18 } }) })] })] }, e.id)); })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                mt: 2,
                                borderTop: "2px solid #e5e7eb",
                                pt: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                bgcolor: "#ee7676",
                                color: "white",
                                px: 2,
                                py: 1.5,
                                borderRadius: 2
                            }, children: [(0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(PaymentsOutlined_1.default, { sx: { color: "#ffffff", fontSize: 20 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: "Total egresos registrados" })] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 20, color: "white", children: formatCOP(total) })] })] }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openConfirm, onClose: function () { return setOpenConfirm(false); }, PaperProps: {
                    sx: {
                        borderRadius: 4,
                        p: 3,
                        minWidth: 360,
                        maxWidth: 400,
                        textAlign: "center",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.12)"
                    }
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", flexDirection: "column", alignItems: "center", mb: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                    bgcolor: "error.main",
                                    color: "white",
                                    borderRadius: "50%",
                                    width: 60,
                                    height: 60,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    mb: 2,
                                    fontSize: 32
                                }, children: "\u26A0\uFE0F" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: 600, gutterBottom: true, children: "Eliminar Egreso" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", children: ["\u00BFEst\u00E1 seguro de eliminar este egreso? ", (0, jsx_runtime_1.jsx)("br", {}), "Esta acci\u00F3n no se puede deshacer."] })] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", justifyContent: "center", spacing: 2, mt: 4, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: function () { return setOpenConfirm(false); }, sx: { borderRadius: 3, px: 4, textTransform: "none" }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "error", onClick: handleConfirmDelete, sx: { borderRadius: 3, px: 4, textTransform: "none" }, children: "Eliminar" })] })] })] }));
}
