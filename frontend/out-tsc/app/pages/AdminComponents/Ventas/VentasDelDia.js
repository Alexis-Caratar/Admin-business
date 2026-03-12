"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var VentasDelDia = function (_a) {
    var ventas = _a.ventas, fecha = _a.fecha;
    var ventasDelDia = (0, react_1.useMemo)(function () {
        return ventas.filter(function (v) {
            if (!v.fecha)
                return false;
            var normal = v.fecha.includes("T") ? v.fecha.split("T")[0] : v.fecha;
            return normal === fecha;
        });
    }, [ventas, fecha]);
    var stats = (0, react_1.useMemo)(function () {
        if (!ventasDelDia.length) {
            return { cantidad: 0, totalDinero: 0, promedio: 0, ventaMayor: 0 };
        }
        var totalDinero = ventasDelDia.reduce(function (sum, v) { return sum + Number(v.total || 0); }, 0);
        var ventaMayor = Math.max.apply(Math, ventasDelDia.map(function (v) { return Number(v.total || 0); }));
        return {
            cantidad: ventasDelDia.length,
            totalDinero: totalDinero,
            promedio: totalDinero / ventasDelDia.length,
            ventaMayor: ventaMayor,
        };
    }, [ventasDelDia]);
    // Array de estadísticas para map
    var statsArray = [
        { label: "Ventas", value: stats.cantidad, color: "primary" },
        { label: "Total del día", value: "$".concat(stats.totalDinero), color: "success.main" },
        { label: "Promedio", value: "$".concat(stats.promedio.toFixed(2)), color: "secondary" },
        { label: "Venta mayor", value: "$".concat(stats.ventaMayor), color: "error.main" },
    ];
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                }, children: statsArray.map(function (stat, idx) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                        flex: "1 1 200px", // ocupa igual espacio, mínimo 200px
                    }, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { sx: { p: 2, textAlign: "center" }, elevation: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", children: stat.label }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", color: stat.color, children: stat.value })] }) }, idx)); }) }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { my: 2 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", mb: 2, children: "Detalle de ventas del d\u00EDa" }), !ventasDelDia.length ? ((0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "No hay ventas este d\u00EDa." })) : ((0, jsx_runtime_1.jsx)(material_1.List, { children: ventasDelDia.map(function (v) { return ((0, jsx_runtime_1.jsx)(material_1.Paper, { sx: { mb: 2, p: 2 }, elevation: 2, children: (0, jsx_runtime_1.jsxs)(material_1.ListItem, { children: [(0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: "Venta #".concat(v.id), secondary: "M\u00E9todo: ".concat(v.metodo_pago || "N/A") }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: "$".concat(v.total), color: "primary", sx: { fontSize: "1rem", fontWeight: "bold" } })] }) }, v.id)); }) }))] }));
};
exports.default = VentasDelDia;
