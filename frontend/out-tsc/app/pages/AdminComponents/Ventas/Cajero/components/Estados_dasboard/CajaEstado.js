"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CajaEstado;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var LockOpen_1 = require("@mui/icons-material/LockOpen");
var Lock_1 = require("@mui/icons-material/Lock");
function CajaEstado(_a) {
    var cajaAbierta = _a.cajaAbierta;
    return ((0, jsx_runtime_1.jsx)(material_1.Card, { sx: { borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", p: 1 }, children: (0, jsx_runtime_1.jsx)(material_1.CardContent, { children: (0, jsx_runtime_1.jsx)(material_1.Stack, { spacing: 2, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", alignItems: "center", spacing: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: {
                                bgcolor: cajaAbierta ? "success.light" : "error.light",
                                width: 48,
                                height: 48
                            }, children: cajaAbierta
                                ? (0, jsx_runtime_1.jsx)(LockOpen_1.default, { sx: { color: "success.dark" } })
                                : (0, jsx_runtime_1.jsx)(Lock_1.default, { sx: { color: "error.dark" } }) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { flex: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Caja del d\u00EDa" }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: cajaAbierta ? "Caja Abierta" : "Caja Cerrada", color: cajaAbierta ? "success" : "error", size: "small" })] })] }) }) }) }));
}
