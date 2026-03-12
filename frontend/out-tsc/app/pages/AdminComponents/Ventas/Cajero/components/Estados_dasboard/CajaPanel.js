"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CajaPanel;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var CajaEstado_1 = require("./CajaEstado");
var CajaMetricas_1 = require("./CajaMetricas");
function CajaPanel(_a) {
    var showStats = _a.showStats, cajaAbierta = _a.cajaAbierta, caja = _a.caja, formatCOP = _a.formatCOP, onVentas = _a.onVentas, onEgresos = _a.onEgresos, onArqueo = _a.onArqueo, onCerrar = _a.onCerrar;
    return ((0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 2, children: (0, jsx_runtime_1.jsx)(material_1.Collapse, { in: showStats, timeout: "auto", unmountOnExit: true, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 300px", children: (0, jsx_runtime_1.jsx)(CajaEstado_1.default, { cajaAbierta: cajaAbierta }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 600px", children: (0, jsx_runtime_1.jsx)(CajaMetricas_1.default, { caja: caja, formatCOP: formatCOP, onVentas: onVentas, onEgresos: onEgresos, onArqueo: onArqueo, onCerrar: onCerrar }) })] }) }) }));
}
