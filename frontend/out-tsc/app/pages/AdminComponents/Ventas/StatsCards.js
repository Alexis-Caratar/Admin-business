"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var CardStat = function (_a) {
    var title = _a.title, value = _a.value, loading = _a.loading;
    return ((0, jsx_runtime_1.jsxs)(material_1.Paper, { elevation: 3, style: {
            padding: 20,
            borderRadius: 16,
            textAlign: "center",
            height: "100%",
        }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle1", sx: { opacity: 0.7 }, children: title }), loading ? ((0, jsx_runtime_1.jsx)(material_1.Skeleton, { variant: "text", height: 40 })) : ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h4", fontWeight: 700, children: value }))] }));
};
var StatsCards = function (_a) {
    var stats = _a.stats, loading = _a.loading;
    return ((0, jsx_runtime_1.jsxs)(material_1.Grid, { container: true, spacing: 2, mb: 3, children: [(0, jsx_runtime_1.jsx)(material_1.Grid, { size: 4, children: (0, jsx_runtime_1.jsx)(CardStat, { title: "Total Ventas", value: stats.totalVentas, loading: loading }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { size: 4, children: (0, jsx_runtime_1.jsx)(CardStat, { title: "Total Dinero", value: "$".concat(stats.totalDinero.toLocaleString()), loading: loading }) }), (0, jsx_runtime_1.jsx)(material_1.Grid, { size: 4, children: (0, jsx_runtime_1.jsx)(CardStat, { title: "Venta Mayor", value: "$".concat(stats.ventaMayor.toLocaleString()), loading: loading }) })] }));
};
exports.default = StatsCards;
