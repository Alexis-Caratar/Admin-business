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
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var productos_1 = require("../../../api/productos");
var sweetalert2_1 = require("sweetalert2");
var material_1 = require("@mui/material");
var Edit_1 = require("@mui/icons-material/Edit");
var Delete_1 = require("@mui/icons-material/Delete");
var ShoppingBag_1 = require("@mui/icons-material/ShoppingBag");
var ArrowBack_1 = require("@mui/icons-material/ArrowBack");
var Search_1 = require("@mui/icons-material/Search");
var QrCode2_1 = require("@mui/icons-material/QrCode2");
var ExpandMore_1 = require("@mui/icons-material/ExpandMore");
var ArrowBackIosNew_1 = require("@mui/icons-material/ArrowBackIosNew");
var ArrowForwardIos_1 = require("@mui/icons-material/ArrowForwardIos");
var Productos_png_1 = require("./../../../assets/img/Productos.png");
var AdminProductos = function (_a) {
    var _b, _c, _d, _f, _g;
    var id = _a.id, onBack = _a.onBack;
    var _h = (0, react_1.useState)([]), productos = _h[0], setProductos = _h[1];
    var _j = (0, react_1.useState)({
        codigo_barra: "",
        nombre: "",
        descripcion: "",
        unidad_medida: "",
        imagenes: [],
    }), form = _j[0], setForm = _j[1];
    var _k = (0, react_1.useState)(null), editingId = _k[0], setEditingId = _k[1];
    var _l = (0, react_1.useState)(false), openModal = _l[0], setOpenModal = _l[1];
    var _m = (0, react_1.useState)(""), search = _m[0], setSearch = _m[1];
    var _o = (0, react_1.useState)(1), page = _o[0], setPage = _o[1];
    var itemsPerPage = 8;
    var _p = (0, react_1.useState)({}), imgIndices = _p[0], setImgIndices = _p[1];
    var unidades = ["kg", "litro", "pieza", "unidad"];
    var defaultImage = Productos_png_1.default;
    // Fetch productos
    var fetchProductos = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, productos_1.getProductos)(id)];
                case 1:
                    data = _a.sent();
                    setProductos(data);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchProductos();
    }, [id]);
    // Filtrado
    var filtered = productos.filter(function (p) {
        return (p.nombre + p.codigo_barra + p.descripcion + p.unidad_medida)
            .toLowerCase()
            .includes(search.toLowerCase());
    });
    // Paginación
    var totalPages = Math.ceil(filtered.length / itemsPerPage);
    var paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    // Carrusel de imágenes
    var prevImage = function (productoId, total) {
        setImgIndices(function (prev) {
            var _a;
            var _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[productoId] = ((_b = prev[productoId]) !== null && _b !== void 0 ? _b : 0 - 1 + total) % total, _a)));
        });
    };
    var nextImage = function (productoId, total) {
        setImgIndices(function (prev) {
            var _a;
            var _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[productoId] = (((_b = prev[productoId]) !== null && _b !== void 0 ? _b : 0) + 1) % total, _a)));
        });
    };
    // CRUD
    var handleOpenModal = function (producto) {
        if (producto) {
            setForm(producto);
            setEditingId(producto.id);
        }
        else {
            setForm({
                codigo_barra: "",
                nombre: "",
                descripcion: "",
                unidad_medida: "",
                tipo_producto: "producto_terminado", // valor por defecto
                stock_actual: 0,
                stock_minimo: 0,
                stock_maximo: 0,
                estado: 1, // por defecto
                publicacion_web: "no", // por defecto
                precios: { id_producto: 0, precio_venta: 0, precio_costo: 0 },
                imagenes: [],
            });
            setEditingId(null);
        }
        setOpenModal(true);
    };
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = {
                        producto: {
                            id_categoria: id,
                            codigo_barra: form.codigo_barra,
                            nombre: form.nombre,
                            descripcion: form.descripcion,
                            unidad_medida: form.unidad_medida,
                            tipo_producto: form.tipo_producto,
                            stock_actual: form.stock_actual,
                            stock_minimo: form.stock_minimo,
                            stock_maximo: form.stock_maximo,
                            estado: form.estado,
                            publicacion_web: form.publicacion_web,
                        },
                        productos_precios: form.precios ? [__assign({}, form.precios)] : [],
                        productos_imagenes: form.imagenes ? __spreadArray([], form.imagenes, true) : [],
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    if (!editingId) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, productos_1.actualizarProducto)(editingId, payload)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, (0, productos_1.crearProducto)(payload)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    setOpenModal(false);
                    return [4 /*yield*/, (0, productos_1.getProductos)(id)];
                case 6:
                    data = _a.sent();
                    setProductos(data);
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    console.error("Error al guardar producto:", error_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleEdit = function (producto) {
        setForm(producto);
        setEditingId(producto.id);
        setOpenModal(true);
    };
    var handleDelete = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!id)
                        return [2 /*return*/];
                    return [4 /*yield*/, sweetalert2_1.default.fire({
                            title: "¿Estás seguro?",
                            text: "¡No podrás revertir esta acción!",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonColor: "#d33",
                            cancelButtonColor: "#3085d6",
                            confirmButtonText: "Sí, eliminar",
                            cancelButtonText: "Cancelar",
                        })];
                case 1:
                    result = _a.sent();
                    if (!result.isConfirmed) return [3 /*break*/, 5];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, (0, productos_1.eliminarProducto)(id)];
                case 3:
                    _a.sent();
                    fetchProductos();
                    sweetalert2_1.default.fire("Eliminado", "El producto ha sido eliminado.", "success");
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    sweetalert2_1.default.fire("Error", "No se pudo eliminar el producto.", "error");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { p: 0, ml: 0, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { startIcon: (0, jsx_runtime_1.jsx)(ArrowBack_1.default, {}), onClick: onBack, sx: { mb: 2, fontWeight: "bold" }, children: "Volver" }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", fontWeight: 600, sx: { display: "flex", alignItems: "center", gap: 1 }, children: [(0, jsx_runtime_1.jsx)(ShoppingBag_1.default, { sx: { fontSize: 28 } }), "Administrar Productos"] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", startIcon: (0, jsx_runtime_1.jsx)(ShoppingBag_1.default, {}), onClick: function () { return handleOpenModal(); }, children: "Crear Producto" })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { mb: 3, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                        display: "flex",
                        alignItems: "center",
                        background: "#f1f3f4",
                        px: 2,
                        borderRadius: 5,
                        width: 450,
                        height: 38,
                    }, children: [(0, jsx_runtime_1.jsx)(Search_1.default, { sx: { opacity: 0.6, mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { variant: "standard", placeholder: "Buscar producto...", value: search, onChange: function (e) {
                                setSearch(e.target.value);
                                setPage(1);
                            }, InputProps: { disableUnderline: true }, fullWidth: true })] }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 3, children: paginated.map(function (p) {
                    var _a, _b;
                    var imgIndex = (_a = imgIndices[p.id]) !== null && _a !== void 0 ? _a : 0;
                    return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 24px)" // xs: full width
                        , sx: {
                            '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' }, // sm: 2 por fila
                            '@media (min-width:900px)': { flex: '1 1 calc(25% - 24px)' }, // md: 4 por fila
                            maxWidth: 200, // opcional: ancho máximo para las tarjetas
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { sx: {
                                width: "100%",
                                height: 320,
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 3,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                transition: "all 0.3s ease",
                                position: "relative",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                                },
                            }, children: [p.estado !== undefined && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                        position: "absolute",
                                        top: 8,
                                        right: 8,
                                        px: 1.5,
                                        py: 0.5,
                                        zIndex: 1,
                                        borderRadius: 1,
                                        bgcolor: p.estado === 1
                                            ? "success.main"
                                            : p.estado === 2
                                                ? "error.main"
                                                : "grey.500",
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }, children: p.estado === 1
                                        ? "Activo"
                                        : p.estado === 2
                                            ? "Descontinuado"
                                            : "Inactivo" })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                        position: "relative",
                                        width: "100%",
                                        height: 150,
                                        minWidth: 10,
                                        overflow: "hidden",
                                        borderTopLeftRadius: 12,
                                        borderTopRightRadius: 12,
                                    }, children: [(0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", image: p.imagenes && p.imagenes.length > 0 ? p.imagenes[imgIndex].url : defaultImage, alt: p.nombre, sx: { width: "100%", height: "100%", objectFit: "cover" } }), p.imagenes && p.imagenes.length > 1 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { sx: {
                                                        position: "absolute",
                                                        top: "50%",
                                                        left: 4,
                                                        transform: "translateY(-50%)",
                                                        bgcolor: "rgba(0,0,0,0.3)",
                                                        color: "#fff",
                                                        "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
                                                    }, size: "small", onClick: function () { return prevImage(p.id, p.imagenes.length); }, children: (0, jsx_runtime_1.jsx)(ArrowBackIosNew_1.default, { fontSize: "small" }) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { sx: {
                                                        position: "absolute",
                                                        top: "50%",
                                                        right: 4,
                                                        transform: "translateY(-50%)",
                                                        bgcolor: "rgba(0,0,0,0.3)",
                                                        color: "#fff",
                                                        "&:hover": { bgcolor: "rgba(0,0,0,0.5)" },
                                                    }, size: "small", onClick: function () { return nextImage(p.id, p.imagenes.length); }, children: (0, jsx_runtime_1.jsx)(ArrowForwardIos_1.default, { fontSize: "small" }) })] }))] }), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "subtitle2", color: "textSecondary", noWrap: true, children: [(0, jsx_runtime_1.jsx)(QrCode2_1.default, { fontSize: "small", sx: { color: "#fb8c00" } }), "Codigo:", (0, jsx_runtime_1.jsx)("b", { children: p.codigo_barra })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                mt: 0.2,
                                                p: 0.2,
                                                width: "100%",
                                                minWidth: 80,
                                                background: "#f5f5f5",
                                                borderRadius: 1,
                                                maxHeight: 90,
                                                overflowY: "auto",
                                                fontSize: 13,
                                            }, children: (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", fontWeight: 700, noWrap: true, children: p.nombre }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [p.stock_actual !== undefined && ((0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: p.stock_actual <= 5 ? "error.main" : "textSecondary", children: ["Stock: ", p.stock_actual] })), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body1", fontWeight: 1000, color: "success.main", children: ((_b = p.precios) === null || _b === void 0 ? void 0 : _b.precio_venta) != null
                                                        ? new Intl.NumberFormat("es-CO", {
                                                            style: "currency",
                                                            currency: "COP",
                                                            minimumFractionDigits: 2,
                                                        }).format(Number(p.precios.precio_venta))
                                                        : "$0.00" })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", children: ["Unidad: ", p.unidad_medida || "N/A"] }), p.descripcion && ((0, jsx_runtime_1.jsxs)(material_1.Box, { mt: 0.5, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 0.5, sx: { cursor: "pointer" }, onClick: function () {
                                                        return setProductos(function (prev) {
                                                            return prev.map(function (x) { return (x.id === p.id ? __assign(__assign({}, x), { showDesc: !x.showDesc }) : x); });
                                                        });
                                                    }, children: [(0, jsx_runtime_1.jsx)(ExpandMore_1.default, { sx: {
                                                                transition: "0.3s",
                                                                transform: p.showDesc ? "rotate(180deg)" : "rotate(0deg)",
                                                                color: "#1976d2",
                                                            } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", fontWeight: 600, color: "primary", children: "Descripci\u00F3n" })] }), p.showDesc && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                        mt: 1,
                                                        p: 1,
                                                        width: "100%",
                                                        maxWidth: 200,
                                                        background: "#f5f5f5",
                                                        borderRadius: 1,
                                                        maxHeight: 90,
                                                        overflowY: "auto",
                                                        fontSize: 13,
                                                    }, children: p.descripcion || "Sin descripción" }))] })), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "flex-end", mt: 1, children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "primary", onClick: function () { return handleEdit(p); }, children: (0, jsx_runtime_1.jsx)(Edit_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "error", onClick: function () { return handleDelete(p.id); }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })] })] })] }) }, p.id));
                }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", justifyContent: "center", mt: 4, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: page, onChange: function (_e, value) { return setPage(value); }, color: "primary", shape: "rounded" }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openModal, onClose: function () { return setOpenModal(false); }, fullWidth: true, maxWidth: "sm", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: editingId ? "Editar Producto" : "Crear Producto" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { display: "flex", flexDirection: "column", gap: 2, mt: 1 }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "C\u00F3digo", value: form.codigo_barra, onChange: function (e) { return setForm(__assign(__assign({}, form), { codigo_barra: e.target.value })); }, fullWidth: true, required: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombre", value: form.nombre, onChange: function (e) { return setForm(__assign(__assign({}, form), { nombre: e.target.value })); }, fullWidth: true, required: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Descripci\u00F3n", value: form.descripcion, onChange: function (e) { return setForm(__assign(__assign({}, form), { descripcion: e.target.value })); }, fullWidth: true, multiline: true, rows: 2 }), (0, jsx_runtime_1.jsx)(material_1.Autocomplete, { freeSolo: true, options: unidades, value: form.unidad_medida || "", onChange: function (_, newValue) {
                                    return setForm(__assign(__assign({}, form), { unidad_medida: newValue || "" }));
                                }, onInputChange: function (_, newInputValue) {
                                    return setForm(__assign(__assign({}, form), { unidad_medida: newInputValue }));
                                }, renderInput: function (params) { return (0, jsx_runtime_1.jsx)(material_1.TextField, __assign({}, params, { label: "Unidad de medida", fullWidth: true })); } }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, label: "Tipo de Producto", value: form.tipo_producto || "producto_terminado", onChange: function (e) { return setForm(__assign(__assign({}, form), { tipo_producto: e.target.value })); }, fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "Producto", children: "Producto" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "Producto_con_insumo", children: "Producto con insumo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "insumo", children: "Insumo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "servicio", children: "Servicio" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "otro", children: "Otro" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Stock Actual", type: "number", value: form.stock_actual || 0, onChange: function (e) { return setForm(__assign(__assign({}, form), { stock_actual: Number(e.target.value) })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Stock M\u00EDnimo", type: "number", value: form.stock_minimo || 0, onChange: function (e) { return setForm(__assign(__assign({}, form), { stock_minimo: Number(e.target.value) })); }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Stock M\u00E1ximo", type: "number", value: form.stock_maximo || 0, onChange: function (e) { return setForm(__assign(__assign({}, form), { stock_maximo: Number(e.target.value) })); }, fullWidth: true })] }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, label: "Estado", value: (_b = form.estado) !== null && _b !== void 0 ? _b : 1, onChange: function (e) { return setForm(__assign(__assign({}, form), { estado: Number(e.target.value) })); }, fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: 1, children: "Activo" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: 0, children: "Inactivo" })] }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, label: "Publicaci\u00F3n Web", value: (_c = form.publicacion_web) !== null && _c !== void 0 ? _c : 0, onChange: function (e) { return setForm(__assign(__assign({}, form), { publicacion_web: String(e.target.value) })); }, fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: 0, children: "No" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: 1, children: "S\u00ED" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Precio Costo", type: "number", value: ((_d = form.precios) === null || _d === void 0 ? void 0 : _d.precio_costo) || "", onChange: function (e) {
                                            return setForm(__assign(__assign({}, form), { precios: __assign(__assign({}, form.precios), { precio_costo: Number(e.target.value) }) }));
                                        }, fullWidth: true }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Precio Venta", type: "number", value: ((_f = form.precios) === null || _f === void 0 ? void 0 : _f.precio_venta) || "", onChange: function (e) {
                                            return setForm(__assign(__assign({}, form), { precios: __assign(__assign({}, form.precios), { precio_venta: Number(e.target.value) }) }));
                                        }, fullWidth: true })] }), (_g = form.imagenes) === null || _g === void 0 ? void 0 : _g.map(function (img, index) { return ((0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Imagen ".concat(index + 1), value: img.url, onChange: function (e) {
                                    var imgs = __spreadArray([], (form.imagenes || []), true);
                                    imgs[index].url = e.target.value;
                                    setForm(__assign(__assign({}, form), { imagenes: imgs }));
                                }, fullWidth: true }, index)); }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", onClick: function () {
                                    var _a;
                                    return setForm(__assign(__assign({}, form), { imagenes: __spreadArray(__spreadArray([], (form.imagenes || []), true), [
                                            { id_producto: form.id, url: "", orden: ((_a = form.imagenes) === null || _a === void 0 ? void 0 : _a.length) || 0, activo: 1 },
                                        ], false) }));
                                }, children: "Agregar Imagen" })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: function () { return setOpenModal(false); }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", color: "primary", onClick: handleSubmit, children: editingId ? "Actualizar" : "Crear" })] })] })] }));
};
exports.default = AdminProductos;
