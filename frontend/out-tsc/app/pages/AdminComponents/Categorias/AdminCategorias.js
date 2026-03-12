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
var Category_1 = require("@mui/icons-material/Category");
var Search_1 = require("@mui/icons-material/Search");
var Add_1 = require("@mui/icons-material/Add");
var Edit_1 = require("@mui/icons-material/Edit");
var Delete_1 = require("@mui/icons-material/Delete");
var categorias_1 = require("../../../api/categorias");
var sweetalert2_1 = require("sweetalert2");
var AdminProductos_1 = require("../Productos/AdminProductos");
var AdminCategorias = function () {
    var _a = (0, react_1.useState)([]), categorias = _a[0], setCategorias = _a[1];
    var _b = (0, react_1.useState)(""), search = _b[0], setSearch = _b[1];
    var _c = (0, react_1.useState)(1), page = _c[0], setPage = _c[1];
    var itemsPerPage = 6;
    var _d = (0, react_1.useState)(false), showProductos = _d[0], setShowProductos = _d[1];
    var _e = (0, react_1.useState)(null), selectedCategoriaId = _e[0], setSelectedCategoriaId = _e[1];
    var cleanForm = function () {
        setForm({
            nombre: "",
            descripcion: "",
            imagen: "",
            activo: 1,
        });
    };
    var _f = (0, react_1.useState)({
        nombre: "",
        descripcion: "",
        imagen: "",
        activo: 1,
    }), form = _f[0], setForm = _f[1];
    var _g = (0, react_1.useState)(null), editingId = _g[0], setEditingId = _g[1];
    var _h = (0, react_1.useState)(false), openModal = _h[0], setOpenModal = _h[1];
    var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
        var id_negocio, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id_negocio = localStorage.getItem("id_negocio") || "";
                    return [4 /*yield*/, (0, categorias_1.getCategorias)(id_negocio)];
                case 1:
                    data = _a.sent();
                    setCategorias(data);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchData();
    }, []);
    // FILTRO
    var filtered = (0, react_1.useMemo)(function () {
        return categorias.filter(function (c) {
            return c.nombre.toLowerCase().includes(search.toLowerCase());
        });
    }, [categorias, search]);
    // PAGINACIÓN
    var paginated = (0, react_1.useMemo)(function () {
        var start = (page - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, page]);
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var id_negocio;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id_negocio = localStorage.getItem("id_negocio") || "";
                    if (!editingId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, categorias_1.actualizarCategoria)(editingId, form)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, categorias_1.crearCategoria)(__assign(__assign({}, form), { id_negocio: Number(id_negocio) }))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    cleanForm();
                    setEditingId(null);
                    setOpenModal(false);
                    fetchData();
                    return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sweetalert2_1.default.fire({
                        title: "¿Eliminar categoría?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Eliminar",
                    })];
                case 1:
                    result = _a.sent();
                    if (!result.isConfirmed) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, categorias_1.eliminarCategoria)(id)];
                case 2:
                    _a.sent();
                    fetchData();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleOpenProductos = function (id) {
        setSelectedCategoriaId(id);
        setShowProductos(true);
    };
    var handleBack = function () {
        setShowProductos(false);
        setSelectedCategoriaId(null);
    };
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { p: 3, children: showProductos && selectedCategoriaId !== null ? ((0, jsx_runtime_1.jsx)(AdminProductos_1.default, { id: selectedCategoriaId, onBack: handleBack })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(Category_1.default, { fontSize: "large", sx: { color: "#1976d2" } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", fontWeight: 700, children: "Administrar Categor\u00EDas" })] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(Add_1.default, {}), onClick: function () {
                                cleanForm();
                                setEditingId(null);
                                setOpenModal(true);
                            }, sx: { borderRadius: 3 }, children: "Crear Categor\u00EDa" })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { mb: 3, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                            display: "flex",
                            alignItems: "center",
                            background: "#f1f3f4",
                            px: 2,
                            borderRadius: 5,
                            width: 450,
                            height: 38,
                        }, children: [(0, jsx_runtime_1.jsx)(Search_1.default, { sx: { opacity: 0.6, mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { variant: "standard", placeholder: "Buscar...", value: search, onChange: function (e) { return setSearch(e.target.value); }, InputProps: { disableUnderline: true }, fullWidth: true })] }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 3, children: paginated.map(function (c) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 24px)" // xs: 1 por fila
                        , sx: {
                            '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' }, // sm: 2 por fila
                            '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 24px)' }, // md: 3 por fila
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                                transition: "transform .2s, box-shadow .2s",
                                cursor: "pointer",
                                "&:hover": {
                                    transform: "translateY(-6px)",
                                    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                                },
                            }, children: [(0, jsx_runtime_1.jsx)("div", { onClick: function () { return handleOpenProductos(c.id); }, children: (0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: "150", image: c.imagen || "https://via.placeholder.com/150", sx: { objectFit: "cover" } }) }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", children: c.nombre }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", children: c.descripcion }), (0, jsx_runtime_1.jsxs)(material_1.Box, { mt: 1, display: "flex", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: function (e) {
                                                        var _a;
                                                        e.stopPropagation();
                                                        setEditingId(c.id);
                                                        setForm({
                                                            nombre: c.nombre || "",
                                                            descripcion: c.descripcion || "",
                                                            imagen: c.imagen || "",
                                                            activo: (_a = c.activo) !== null && _a !== void 0 ? _a : 1,
                                                        });
                                                        setOpenModal(true);
                                                    }, children: (0, jsx_runtime_1.jsx)(Edit_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "error", onClick: function (e) {
                                                        e.stopPropagation();
                                                        handleDelete(c.id);
                                                    }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })] })] })] }) }, c.id)); }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { mt: 4, display: "flex", justifyContent: "center", children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: Math.ceil(filtered.length / itemsPerPage), page: page, onChange: function (_, v) { return setPage(v); }, color: "primary" }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openModal, onClose: function () {
                        setOpenModal(false);
                        setEditingId(null);
                        cleanForm();
                    }, PaperProps: { sx: { borderRadius: 4, p: 1, width: 450 } }, children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { sx: { fontWeight: 700, textAlign: "center", pb: 1 }, children: editingId ? "Editar Categoría" : "Nueva Categoría" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombre", fullWidth: true, value: form.nombre, onChange: function (e) { return setForm(__assign(__assign({}, form), { nombre: e.target.value })); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Descripci\u00F3n", fullWidth: true, multiline: true, rows: 2, value: form.descripcion, onChange: function (e) { return setForm(__assign(__assign({}, form), { descripcion: e.target.value })); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "URL Imagen", fullWidth: true, value: form.imagen, onChange: function (e) { return setForm(__assign(__assign({}, form), { imagen: e.target.value })); } })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { sx: { p: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { sx: { borderRadius: 3 }, onClick: function () {
                                        setOpenModal(false);
                                        setEditingId(null);
                                        cleanForm();
                                    }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", sx: { borderRadius: 3 }, onClick: handleSubmit, children: editingId ? "Actualizar" : "Crear" })] })] })] })) }));
};
exports.default = AdminCategorias;
