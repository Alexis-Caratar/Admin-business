"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CajaMetricas;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var ShoppingCart_1 = require("@mui/icons-material/ShoppingCart");
var Payments_1 = require("@mui/icons-material/Payments");
var ReceiptLong_1 = require("@mui/icons-material/ReceiptLong");
var Savings_1 = require("@mui/icons-material/Savings");
var MonetizationOn_1 = require("@mui/icons-material/MonetizationOn");
function CajaMetricas(_a) {
    var caja = _a.caja, formatCOP = _a.formatCOP, onVentas = _a.onVentas, onEgresos = _a.onEgresos, onArqueo = _a.onArqueo, onCerrar = _a.onCerrar;
    var items = [
        {
            label: "Monto inicial",
            value: caja === null || caja === void 0 ? void 0 : caja.monto_inicial,
            icon: (0, jsx_runtime_1.jsx)(MonetizationOn_1.default, {}),
            color: "primary.light"
        },
        {
            label: "Ventas / Recaudado",
            value: caja === null || caja === void 0 ? void 0 : caja.total_ventas,
            extra: caja === null || caja === void 0 ? void 0 : caja.dinero_recaudado,
            icon: (0, jsx_runtime_1.jsx)(ShoppingCart_1.default, {}),
            color: "#7c4dff",
            click: onVentas
        },
        {
            label: "Egresos",
            value: caja === null || caja === void 0 ? void 0 : caja.total_egresos,
            icon: (0, jsx_runtime_1.jsx)(Payments_1.default, {}),
            color: "error.light",
            click: onEgresos
        },
        {
            label: "Arqueo",
            value: null,
            icon: (0, jsx_runtime_1.jsx)(ReceiptLong_1.default, {}),
            color: "warning.light",
            click: onArqueo
        },
        {
            label: "Cerrar Caja",
            value: null,
            icon: (0, jsx_runtime_1.jsx)(Savings_1.default, {}),
            color: "error.light",
            click: onCerrar
        }
    ];
    return ((0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, children: items.map(function (item, i) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 16px)" // xs: full width
            , sx: {
                '@media (min-width:600px)': { flex: '1 1 calc(50% - 16px)' }, // sm: 2 por fila
                '@media (min-width:900px)': { flex: '1 1 calc(25% - 16px)' }, // md: 4 por fila
            }, children: (0, jsx_runtime_1.jsx)(material_1.Card, { onClick: item.click, sx: {
                    borderRadius: 3,
                    cursor: item.click ? "pointer" : "default",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                    transition: "all .2s ease",
                    "&:hover": item.click && {
                        transform: "translateY(-3px)",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.12)"
                    }
                }, children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 2, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: item.color, width: 44, height: 44 }, children: item.icon }), (0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", color: "text.secondary", fontWeight: 600, children: item.label }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 16, children: item.extra != null && item.value != null
                                            ? "".concat(formatCOP(item.value), " - ").concat(formatCOP(item.extra))
                                            : item.value != null
                                                ? formatCOP(item.value)
                                                : "" })] })] }) }) }) }, i)); }) }));
}
