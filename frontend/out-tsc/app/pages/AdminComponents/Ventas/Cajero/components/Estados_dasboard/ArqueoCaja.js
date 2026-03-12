"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArqueoCajaModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var ExpandMore_1 = require("@mui/icons-material/ExpandMore");
var Savings_1 = require("@mui/icons-material/Savings");
var PointOfSale_1 = require("@mui/icons-material/PointOfSale");
var AttachMoney_1 = require("@mui/icons-material/AttachMoney");
var RestaurantMenu_1 = require("@mui/icons-material/RestaurantMenu");
var ArqueoCajaModal = function (_a) {
    var _b, _c, _d, _e;
    var open = _a.open, onClose = _a.onClose, arqueoInfo = _a.arqueoInfo;
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value || 0);
    };
    var totalEnCaja = arqueoInfo
        ? Number(arqueoInfo.monto_inicial) +
            Number(arqueoInfo.total_ventas) -
            Number(arqueoInfo.total_egresos)
        : 0;
    /** Agrupar productos por categoría */
    var productosPorCategoria = (_b = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.productos) === null || _b === void 0 ? void 0 : _b.reduce(function (acc, item) {
        if (!acc[item.categoria])
            acc[item.categoria] = [];
        acc[item.categoria].push(item);
        return acc;
    }, {});
    return ((0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: onClose, maxWidth: "md", fullWidth: true, PaperProps: {
            sx: {
                borderRadius: 4,
                p: 1,
            },
        }, children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { sx: { fontWeight: "bold", textAlign: "center", pb: 1 }, children: "Arqueo de Caja" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { sx: { py: 3 }, children: !arqueoInfo ? ((0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", flexDirection: "column", alignItems: "center", py: 6, children: [(0, jsx_runtime_1.jsx)(material_1.CircularProgress, { size: 45 }), (0, jsx_runtime_1.jsx)(material_1.Typography, { mt: 2, color: "text.secondary", children: "Cargando datos del arqueo..." })] })) : ((0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1.5, children: [(0, jsx_runtime_1.jsx)(material_1.Card, { elevation: 10, sx: { borderRadius: 3 }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "primary.main", width: 50, height: 50 }, children: (0, jsx_runtime_1.jsx)(Savings_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, color: "text.secondary", children: "Monto Inicial - BASE" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 22, fontWeight: "bold", children: formatCOP(arqueoInfo.monto_inicial) })] })] }) }), (0, jsx_runtime_1.jsxs)(material_1.Accordion, { sx: {
                                borderRadius: 3,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                                "&:before": { display: "none" }
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.AccordionSummary, { expandIcon: (0, jsx_runtime_1.jsx)(ExpandMore_1.default, {}), children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: {
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            width: "100%"
                                        }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: {
                                                    bgcolor: "success.main",
                                                    width: 50,
                                                    height: 50
                                                }, children: (0, jsx_runtime_1.jsx)(PointOfSale_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: "Ventas Totales" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 24, fontWeight: "bold", color: "success.main", children: formatCOP(arqueoInfo.total_ventas) })] })] }) }), (0, jsx_runtime_1.jsx)(material_1.AccordionDetails, { children: (0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 0.1, children: (_c = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.ventas_metodos) === null || _c === void 0 ? void 0 : _c.map(function (v) {
                                            var total = arqueoInfo.total_ventas || 0;
                                            var porcentaje = total
                                                ? ((v.total / total) * 100).toFixed(1)
                                                : 0;
                                            var getColor = function (metodo) {
                                                switch (metodo) {
                                                    case "EFECTIVO":
                                                        return "#4caf50";
                                                    case "TARJETA":
                                                        return "#1976d2";
                                                    case "TRANSFERENCIA":
                                                        return "#6a1b9a";
                                                    case "NEQUI":
                                                        return "#ff4081";
                                                    case "DAVIPLATA":
                                                        return "#ff9800";
                                                    case "PENDIENTE":
                                                        return "#9e9e9e";
                                                    default:
                                                        return "#607d8b";
                                                }
                                            };
                                            var getIcon = function (metodo) {
                                                switch (metodo) {
                                                    case "EFECTIVO":
                                                        return "💵";
                                                    case "TARJETA":
                                                        return "💳";
                                                    case "TRANSFERENCIA":
                                                        return "🏦";
                                                    case "NEQUI":
                                                        return "💜";
                                                    case "DAVIPLATA":
                                                        return "📱";
                                                    case "PENDIENTE":
                                                        return "⏳";
                                                    default:
                                                        return "💰";
                                                }
                                            };
                                            return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                    p: 0.5,
                                                    borderRadius: 2,
                                                    border: "1px solid #eee",
                                                    bgcolor: "#fafafa",
                                                    transition: "all .2s ease",
                                                    "&:hover": {
                                                        transform: "translateY(-2px)",
                                                        boxShadow: 2
                                                    }
                                                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, children: getIcon(v.metodo_pago) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: v.metodo_pago })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { textAlign: "right", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", sx: {
                                                                            color: getColor(v.metodo_pago)
                                                                        }, children: formatCOP(v.total) }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 10, color: "text.secondary", children: [porcentaje, " %"] })] })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                            height: 6,
                                                            borderRadius: 5,
                                                            bgcolor: "#eee",
                                                            overflow: "hidden"
                                                        }, children: (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                                                                width: "".concat(porcentaje, "%"),
                                                                height: "100%",
                                                                bgcolor: getColor(v.metodo_pago),
                                                                transition: "width .4s ease"
                                                            } }) })] }, v.metodo_pago));
                                        }) }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Accordion, { sx: {
                                borderRadius: 3,
                                overflow: "hidden",
                                border: "1px solid",
                                borderColor: "divider",
                                "&:before": { display: "none" }
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.AccordionSummary, { expandIcon: (0, jsx_runtime_1.jsx)(ExpandMore_1.default, {}), children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "error.main", width: 50, height: 50 }, children: (0, jsx_runtime_1.jsx)(AttachMoney_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: "Egresos Totales" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 24, fontWeight: "bold", color: "error.main", children: formatCOP(arqueoInfo.total_egresos) })] })] }) }), (0, jsx_runtime_1.jsx)(material_1.AccordionDetails, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1.5, children: [((_d = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.egresos) === null || _d === void 0 ? void 0 : _d.length) === 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "No hay egresos registrados" })), (_e = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.egresos) === null || _e === void 0 ? void 0 : _e.map(function (e) {
                                                var getIcon = function (metodo) {
                                                    switch (metodo) {
                                                        case "EFECTIVO":
                                                            return "💵";
                                                        case "TARJETA":
                                                            return "💳";
                                                        case "TRANSFERENCIA":
                                                            return "🏦";
                                                        default:
                                                            return "💰";
                                                    }
                                                };
                                                var fecha = new Date(e.created_at).toLocaleString("es-CO");
                                                return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        border: "1px solid #eee",
                                                        bgcolor: "#fff7f7",
                                                        transition: "all .2s ease",
                                                        "&:hover": {
                                                            transform: "translateY(-2px)",
                                                            boxShadow: 2
                                                        }
                                                    }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, fontSize: 14, children: e.descripcion }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: ["Egreso # ", e.numero_egreso, " \u2022 ", fecha] })] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: "bold", color: "error.main", fontSize: 15, children: ["- ", formatCOP(e.monto)] })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: [getIcon(e.metodo_pago), " ", e.metodo_pago] }), e.observacion && ((0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 12, color: "text.secondary", sx: {
                                                                        fontStyle: "italic"
                                                                    }, children: e.observacion }))] })] }, e.id));
                                            })] }) })] }), (0, jsx_runtime_1.jsx)(material_1.Card, { elevation: 4, sx: { borderRadius: 3, bgcolor: "#e8f5e9" }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { sx: { display: "flex", alignItems: "center", gap: 2 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: "success.dark", width: 50, height: 50 }, children: (0, jsx_runtime_1.jsx)(AttachMoney_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, color: "text.secondary", children: "Total en Caja" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 24, fontWeight: "bold", color: "success.dark", children: formatCOP(totalEnCaja) })] })] }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: "bold", fontSize: 18, mb: 2, display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(RestaurantMenu_1.default, {}), " Productos Vendidos"] }), productosPorCategoria &&
                                    Object.keys(productosPorCategoria).map(function (categoria) {
                                        var productos = productosPorCategoria[categoria];
                                        var totalCategoria = productos.reduce(function (acc, p) { return acc + Number(p.total_vendido); }, 0);
                                        return ((0, jsx_runtime_1.jsxs)(material_1.Accordion, { sx: {
                                                mb: 2,
                                                borderRadius: 3,
                                                overflow: "hidden",
                                                border: "1px solid",
                                                borderColor: "divider",
                                                "&:before": { display: "none" }
                                            }, children: [(0, jsx_runtime_1.jsx)(material_1.AccordionSummary, { expandIcon: (0, jsx_runtime_1.jsx)(ExpandMore_1.default, { sx: { color: "black" } }), sx: {
                                                        background: "linear-gradient(135deg, #09a58e, #2e7d32)",
                                                        color: "black",
                                                        px: 2,
                                                        py: 1.2
                                                    }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(RestaurantMenu_1.default, { fontSize: "small" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: "bold", fontSize: 15, children: categoria })] }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: formatCOP(totalCategoria), size: "small", sx: {
                                                                    bgcolor: "white",
                                                                    color: "primary.main",
                                                                    fontWeight: "bold"
                                                                } })] }) }), (0, jsx_runtime_1.jsx)(material_1.AccordionDetails, { sx: { p: 0 }, children: productos.map(function (prod, index) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                            px: 2,
                                                            py: 1.2,
                                                            display: "grid",
                                                            gridTemplateColumns: "1fr 80px 120px",
                                                            alignItems: "center",
                                                            borderBottom: index !== productos.length - 1
                                                                ? "1px solid #eee"
                                                                : "none",
                                                            "&:hover": {
                                                                bgcolor: "#f7f9fc",
                                                            }
                                                        }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 14, children: prod.producto }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: "bold", textAlign: "center", sx: {
                                                                    bgcolor: "#eef2ff",
                                                                    color: "primary.main",
                                                                    borderRadius: 2,
                                                                    px: 1,
                                                                    py: 0.3,
                                                                    fontSize: 13,
                                                                    width: "fit-content",
                                                                    mx: "auto"
                                                                }, children: ["x", prod.cantidad_vendida] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, textAlign: "right", color: "success.main", children: formatCOP(prod.total_vendido) })] }, prod.id_producto)); }) })] }, categoria));
                                    })] })] })) }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { pb: 2, px: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: onClose, variant: "contained", fullWidth: true, sx: {
                        py: 1,
                        fontWeight: "bold",
                        borderRadius: 2,
                    }, children: "Cerrar" }) })] }));
};
exports.ArqueoCajaModal = ArqueoCajaModal;
