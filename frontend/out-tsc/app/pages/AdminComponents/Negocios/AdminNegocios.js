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
var negocios_1 = require("../../../api/negocios");
var sweetalert2_1 = require("sweetalert2");
var material_1 = require("@mui/material");
var Edit_1 = require("@mui/icons-material/Edit");
var Delete_1 = require("@mui/icons-material/Delete");
var AddBusiness_1 = require("@mui/icons-material/AddBusiness");
var Search_1 = require("@mui/icons-material/Search");
var Store_1 = require("@mui/icons-material/Store");
var AdminNegocios = function () {
    var _a = (0, react_1.useState)([]), negocios = _a[0], setNegocios = _a[1];
    var _b = (0, react_1.useState)(false), isModalOpen = _b[0], setIsModalOpen = _b[1];
    var _c = (0, react_1.useState)({
        nombre: "",
        direccion: "",
        telefono: "",
        descripcion: "",
        imagen: "",
    }), form = _c[0], setForm = _c[1];
    var _d = (0, react_1.useState)(null), editingId = _d[0], setEditingId = _d[1];
    // 🔍 Buscador
    var _e = (0, react_1.useState)(""), search = _e[0], setSearch = _e[1];
    // 📄 Paginación
    var _f = (0, react_1.useState)(1), page = _f[0], setPage = _f[1];
    var itemsPerPage = 8;
    var fetchNegocios = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, negocios_1.getNegocios)()];
                case 1:
                    data = _a.sent();
                    setNegocios(data);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchNegocios();
    }, []);
    // Filtrar por buscador
    var filtered = (0, react_1.useMemo)(function () {
        return negocios.filter(function (n) {
            var _a, _b;
            return n.nombre.toLowerCase().includes(search.toLowerCase()) ||
                ((_a = n.direccion) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(search.toLowerCase())) ||
                ((_b = n.descripcion) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(search.toLowerCase()));
        });
    }, [search, negocios]);
    // Calcular paginación
    var totalPages = Math.ceil(filtered.length / itemsPerPage);
    var negociosPaginated = (0, react_1.useMemo)(function () {
        var start = (page - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, page]);
    var openCreateModal = function () {
        setForm({
            nombre: "",
            direccion: "",
            telefono: "",
            descripcion: "",
            imagen: "",
        });
        setEditingId(null);
        setIsModalOpen(true);
    };
    var openEditModal = function (negocio) {
        setForm(negocio);
        setEditingId(negocio.id);
        setIsModalOpen(true);
    };
    var closeModal = function () {
        setIsModalOpen(false);
        setEditingId(null);
    };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!editingId) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, negocios_1.actualizarNegocio)(editingId, form)];
                case 2:
                    _a.sent();
                    sweetalert2_1.default.fire("Actualizado", "El negocio ha sido actualizado.", "success");
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, (0, negocios_1.crearNegocio)(form)];
                case 4:
                    _a.sent();
                    sweetalert2_1.default.fire("Creado", "El negocio ha sido creado.", "success");
                    _a.label = 5;
                case 5:
                    closeModal();
                    fetchNegocios();
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    sweetalert2_1.default.fire("Error", "Hubo un problema al guardar el negocio.", "error");
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!id)
                        return [2 /*return*/];
                    return [4 /*yield*/, sweetalert2_1.default.fire({
                            title: "¿Estás seguro?",
                            text: "No podrás revertir esta acción.",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Eliminar",
                            cancelButtonText: "Cancelar",
                        })];
                case 1:
                    result = _a.sent();
                    if (!result.isConfirmed) return [3 /*break*/, 5];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, negocios_1.eliminarNegocio)(id)];
                case 3:
                    _a.sent();
                    fetchNegocios();
                    sweetalert2_1.default.fire("Eliminado", "El negocio ha sido eliminado.", "success");
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    sweetalert2_1.default.fire("Error", "No se pudo eliminar.", "error");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { p: 3, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { mb: 3, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", fontWeight: 600, textAlign: "left", flex: 1, sx: { display: "flex", alignItems: "center", gap: 1 }, children: [(0, jsx_runtime_1.jsx)(Store_1.default, { sx: { fontSize: 30 } }), "Administraci\u00F3n de Negocios"] }), (0, jsx_runtime_1.jsx)(material_1.Box, { width: "240px" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", startIcon: (0, jsx_runtime_1.jsx)(AddBusiness_1.default, {}), onClick: openCreateModal, sx: { height: 38 }, children: "Agregar Negocio" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                            display: "flex",
                            alignItems: "center",
                            background: "#f1f3f4",
                            px: 1.5,
                            borderRadius: 5,
                            width: "460px",
                            height: 36,
                            boxShadow: "inset 0 0 4px rgba(0,0,0,0.1)",
                        }, children: [(0, jsx_runtime_1.jsx)(Search_1.default, { sx: { opacity: 0.6, fontSize: 20, mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { variant: "standard", placeholder: "Buscar...", value: search, onChange: function (e) { return setSearch(e.target.value); }, InputProps: {
                                    disableUnderline: true,
                                    style: { fontSize: 14 },
                                }, fullWidth: true })] })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 3, children: negociosPaginated.map(function (n) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 24px)" // xs: 1 por fila
                    , sx: {
                        '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' }, // sm: 2 por fila
                        '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 24px)' }, // md: 3 por fila
                        '@media (min-width:1200px)': { flex: '1 1 calc(25% - 24px)' }, // lg: 4 por fila
                        maxWidth: 350, // opcional: ancho máximo de la tarjeta
                    }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: 350,
                            transition: "0.2s",
                            "&:hover": {
                                transform: "translateY(-5px)",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
                            },
                        }, children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: "150", image: n.imagen ||
                                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQde1Zuns3SWsvZyR31zNW6hWWyf8N20bmBFA&s", alt: n.nombre }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { flex: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: 600, noWrap: true, children: n.nombre }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "textSecondary", sx: {
                                            mt: 1,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }, children: n.descripcion || "Sin descripción" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", sx: { mt: 1, fontSize: 14 }, children: ["\uD83D\uDCCD ", n.direccion, (0, jsx_runtime_1.jsx)("br", {}), "\uD83D\uDCDE ", n.telefono] })] }), (0, jsx_runtime_1.jsxs)(material_1.CardActions, { sx: { justifyContent: "flex-end" }, children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "primary", onClick: function () { return openEditModal(n); }, children: (0, jsx_runtime_1.jsx)(Edit_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "error", onClick: function () { return handleDelete(n.id); }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })] })] }) }, n.id)); }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", justifyContent: "center", mt: 4, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: page, onChange: function (_, value) { return setPage(value); }, color: "primary", size: "medium" }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: isModalOpen, onClose: closeModal, fullWidth: true, maxWidth: "sm", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: editingId ? "Editar Negocio" : "Crear Negocio" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombre", value: form.nombre, onChange: function (e) { return setForm(__assign(__assign({}, form), { nombre: e.target.value })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Direcci\u00F3n", value: form.direccion, onChange: function (e) { return setForm(__assign(__assign({}, form), { direccion: e.target.value })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Tel\u00E9fono", value: form.telefono, onChange: function (e) { return setForm(__assign(__assign({}, form), { telefono: e.target.value })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Descripci\u00F3n", multiline: true, rows: 3, value: form.descripcion, onChange: function (e) { return setForm(__assign(__assign({}, form), { descripcion: e.target.value })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "URL Imagen", value: form.imagen, onChange: function (e) { return setForm(__assign(__assign({}, form), { imagen: e.target.value })); }, fullWidth: true })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: closeModal, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: handleSubmit, variant: "contained", children: editingId ? "Actualizar" : "Crear" })] })] })] }));
};
exports.default = AdminNegocios;
