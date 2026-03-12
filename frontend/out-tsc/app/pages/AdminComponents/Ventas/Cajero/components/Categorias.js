"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Categorias = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var Categorias = function (_a) {
    var categorias = _a.categorias, loading = _a.loading, onOpen = _a.onOpen, _b = _a.modo, modo = _b === void 0 ? "dashboard" : _b;
    var esCarrito = modo === "carrito";
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", mb: 2, sx: {
                    fontSize: { xs: 16, md: 20 },
                }, children: "Categor\u00EDas" }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "Cargando categor\u00EDas..." })) : ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    display: "grid",
                    gap: 1.2,
                    // 👇 AQUÍ ESTA LA MAGIA
                    gridTemplateColumns: esCarrito
                        ? { xs: "repeat(3, 1fr)", md: "2" } // 📱 3 por fila en carrito
                        : "1fr", // Dashboard normal
                }, children: categorias.map(function (cat) {
                    var _a;
                    return ((0, jsx_runtime_1.jsxs)(material_1.Card, { onClick: function () { return onOpen(cat); }, sx: {
                            display: "flex",
                            flexDirection: esCarrito
                                ? "column"
                                : { xs: "column", md: "row" },
                            alignItems: "center",
                            justifyContent: "center",
                            p: esCarrito ? 1 : 1.3,
                            borderRadius: 3,
                            cursor: "pointer",
                            transition: "0.25s",
                            boxShadow: 2,
                            border: "1px solid #e5e5e5",
                            "&:hover": {
                                boxShadow: 5,
                                transform: "translateY(-3px)",
                            },
                        }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: (_a = cat.imagen) !== null && _a !== void 0 ? _a : undefined, sx: {
                                    width: esCarrito
                                        ? 38
                                        : { xs: 50, md: 40 },
                                    height: esCarrito
                                        ? 38
                                        : { xs: 50, md: 40 },
                                    mb: esCarrito ? 0.5 : { xs: 1, md: 0 },
                                    mr: esCarrito
                                        ? 0
                                        : { xs: 0, md: 2 },
                                    borderRadius: 2,
                                    bgcolor: "#f5f5f5",
                                } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: esCarrito
                                    ? 11
                                    : { xs: 12, md: 14 }, fontWeight: 600, textAlign: "center", children: cat.categoria })] }, cat.id));
                }) }))] }));
};
exports.Categorias = Categorias;
