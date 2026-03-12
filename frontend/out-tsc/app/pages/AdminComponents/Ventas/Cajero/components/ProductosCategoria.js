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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductosCategoriaModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var Close_1 = require("@mui/icons-material/Close");
var AddShoppingCart_1 = require("@mui/icons-material/AddShoppingCart");
var Category_1 = require("@mui/icons-material/Category");
var Search_1 = require("@mui/icons-material/Search");
var toastr_1 = require("toastr");
require("toastr/build/toastr.min.css");
var InputAdornment_1 = require("@mui/material/InputAdornment");
toastr_1.default.options = {
    positionClass: "toast-top-right",
    timeOut: 2000,
    progressBar: true,
    closeButton: false,
};
var ProductosCategoriaModal = function (_a) {
    var open = _a.open, onClose = _a.onClose, categoria = _a.categoria, categorias = _a.categorias, onAgregar = _a.onAgregar;
    var theme = (0, material_1.useTheme)();
    var isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down("md"));
    var _b = (0, react_1.useState)(""), search = _b[0], setSearch = _b[1];
    var _c = (0, react_1.useState)(null), categoriaActiva = _c[0], setCategoriaActiva = _c[1];
    var _d = (0, react_1.useState)([]), productos = _d[0], setProductos = _d[1];
    var _e = (0, react_1.useState)(null), animItem = _e[0], setAnimItem = _e[1];
    /* ========= INIT ========= */
    (0, react_1.useEffect)(function () {
        if (categoria) {
            setCategoriaActiva(categoria);
            setProductos(categoria.platos);
        }
        else if (categorias.length > 0) {
            setCategoriaActiva(categorias[0]);
            setProductos(categorias[0].platos);
        }
        setSearch("");
    }, [open, categoria, categorias]);
    var filtered = productos.filter(function (p) { var _a; return (_a = p.nombre) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(search.toLowerCase()); });
    var animarAlCarrito = function (img, rect) {
        setAnimItem({ img: img, start: rect });
        setTimeout(function () {
            setAnimItem(null);
        }, 700);
    };
    var handleAgregar = function (prod, event) {
        var _a, _b;
        if (event) {
            var rect = event.currentTarget.getBoundingClientRect();
            animarAlCarrito((_a = prod.imagen_plato) !== null && _a !== void 0 ? _a : "https://cdn-icons-png.flaticon.com/512/1046/1046784.png", rect);
        }
        onAgregar(__assign(__assign({}, prod), { precio_venta: Number((_b = prod.precio_venta) !== null && _b !== void 0 ? _b : 0) }));
        toastr_1.default.success("".concat(prod.nombre, " agregado"));
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: onClose, fullScreen: isMobile, maxWidth: "lg", fullWidth: true, PaperProps: {
            sx: {
                borderRadius: isMobile ? 0 : 4,
                height: isMobile ? "100%" : "90vh",
                zIndex: 1200,
            },
        }, sx: {
            zIndex: 1200,
        }, children: [(0, jsx_runtime_1.jsxs)(material_1.DialogTitle, { sx: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 2, //
                    borderBottom: "1px solid #eee",
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, { color: "primary" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, children: "Seleccionar Productos" })] }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { onClick: onClose, children: (0, jsx_runtime_1.jsx)(Close_1.default, {}) })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: {
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    p: 0,
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                            width: isMobile ? "100%" : 260,
                            borderRight: isMobile ? "none" : "1px solid #eee",
                            borderBottom: isMobile ? "1px solid #eee" : "none",
                            overflowX: isMobile ? "auto" : "hidden",
                            p: 1,
                        }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 700, display: "flex", alignItems: "center", gap: 1, mb: 1, children: [(0, jsx_runtime_1.jsx)(Category_1.default, { fontSize: "small" }), "Categor\u00EDas"] }), (0, jsx_runtime_1.jsx)(material_1.List, { dense: true, sx: {
                                    display: isMobile ? "flex" : "block",
                                    gap: 1,
                                }, children: categorias.map(function (cat) {
                                    var _a;
                                    var active = (categoriaActiva === null || categoriaActiva === void 0 ? void 0 : categoriaActiva.id) === cat.id;
                                    return ((0, jsx_runtime_1.jsxs)(material_1.ListItemButton, { onClick: function () {
                                            setCategoriaActiva(cat);
                                            setProductos(cat.platos);
                                            setSearch("");
                                        }, selected: active, sx: {
                                            borderRadius: 2,
                                            minWidth: isMobile ? 160 : "auto",
                                            mb: isMobile ? 0 : 0.5,
                                            "&.Mui-selected": {
                                                backgroundColor: "primary.main",
                                                color: "white",
                                            },
                                        }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: cat.imagen || undefined, alt: cat.categoria, sx: {
                                                    width: 32,
                                                    height: 32,
                                                    mr: 1,
                                                    bgcolor: active ? "white" : "primary.main",
                                                    color: active ? "primary.main" : "white",
                                                    fontWeight: 700,
                                                }, children: !cat.imagen && ((_a = cat.categoria) === null || _a === void 0 ? void 0 : _a[0]) }), (0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: cat.categoria, secondary: "".concat(cat.platos.length, " platos"), secondaryTypographyProps: {
                                                    fontSize: 11,
                                                    color: active ? "white" : "text.secondary",
                                                } })] }, cat.id));
                                }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flex: 1, p: 2, overflowY: "auto" }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 800, fontSize: 18, children: categoriaActiva === null || categoriaActiva === void 0 ? void 0 : categoriaActiva.categoria }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "caption", color: "text.secondary", mb: 1, display: "block", children: [filtered.length, " productos disponibles"] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, size: "small", placeholder: "Buscar producto...", value: search, onChange: function (e) { return setSearch(e.target.value); }, InputProps: {
                                    startAdornment: ((0, jsx_runtime_1.jsx)(InputAdornment_1.default, { position: "start", children: (0, jsx_runtime_1.jsx)(Search_1.default, {}) })),
                                }, sx: { mb: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2, // espacio entre cards
                                }, children: filtered.map(function (prod) {
                                    var _a;
                                    return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                            flex: "1 1 150px", // mínimo 150px, crece según el contenedor
                                            maxWidth: 220, // opcional, evita que se estire demasiado
                                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Card, { onClick: function (e) { return handleAgregar(prod, e); }, sx: {
                                                cursor: "pointer",
                                                height: "100%",
                                                borderRadius: 3,
                                                overflow: "hidden",
                                                transition: "0.2s",
                                                boxShadow: 2,
                                                "&:hover": {
                                                    transform: "translateY(-4px)",
                                                    boxShadow: 5,
                                                },
                                            }, children: [prod.imagen_plato ? ((0, jsx_runtime_1.jsx)(material_1.CardMedia, { component: "img", height: isMobile ? 90 : 140, image: prod.imagen_plato, alt: prod.nombre })) : ((0, jsx_runtime_1.jsx)(material_1.Box, { height: isMobile ? 90 : 140, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f6f6f6", children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { width: 44, height: 44 }, children: (_a = prod.nombre) === null || _a === void 0 ? void 0 : _a[0] }) })), (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { p: isMobile ? 1 : 1.5 }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: isMobile ? 12 : 14, noWrap: true, children: prod.nombre }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: isMobile ? 12 : 13, color: "success.main", fontWeight: 800, children: ["$", Number(prod.precio_venta).toLocaleString()] }), (0, jsx_runtime_1.jsx)(material_1.Button, { fullWidth: true, size: "small", variant: "contained", color: "success", startIcon: (0, jsx_runtime_1.jsx)(AddShoppingCart_1.default, {}), onClick: function (e) {
                                                                e.stopPropagation();
                                                                handleAgregar(prod, e);
                                                            }, sx: {
                                                                mt: 0.7,
                                                                fontSize: isMobile ? 11 : 12,
                                                                py: 0.4,
                                                            }, children: "Agregar" })] })] }) }, prod.id));
                                }) })] })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { px: 3, py: 2 }, children: (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: onClose, children: "Cerrar" }) }), animItem && ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: animItem.img, sx: {
                    position: "fixed",
                    left: animItem.start.left,
                    top: animItem.start.top,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    pointerEvents: "none",
                    zIndex: 9999,
                    animation: "flyToCart 0.7s ease-in-out forwards",
                    "@keyframes flyToCart": {
                        "0%": {
                            transform: "scale(1)",
                            opacity: 1,
                        },
                        "100%": {
                            transform: "translate(500px, 300px) scale(0.2)",
                            opacity: 0,
                        },
                    },
                } }))] }));
};
exports.ProductosCategoriaModal = ProductosCategoriaModal;
