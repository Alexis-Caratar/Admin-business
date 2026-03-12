"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AperturaCajaModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var material_1 = require("@mui/material");
var react_router_dom_1 = require("react-router-dom");
var AperturaCajaModal = function (_a) {
    var open = _a.open, monto = _a.monto, setMonto = _a.setMonto, onAbrir = _a.onAbrir;
    var navigate = (0, react_router_dom_1.useNavigate)();
    return ((0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: function (_e, reason) {
            if (reason === "backdropClick" || reason === "escapeKeyDown")
                return;
        }, maxWidth: "xs", fullWidth: true, disableEscapeKeyDown: true, PaperProps: {
            sx: {
                borderRadius: 3,
                p: 1,
            },
        }, children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { sx: {
                    fontWeight: 700,
                    textAlign: "center",
                    pb: 1,
                    fontSize: "1.3rem",
                }, children: "Apertura de Caja" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", color: "text.secondary", textAlign: "center", sx: { mb: 2 }, children: "Ingrese el monto inicial para iniciar la jornada." }), (0, jsx_runtime_1.jsx)(material_1.Box, { children: (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, label: "Monto inicial", value: new Intl.NumberFormat("es-CO").format(Number(monto) || 0), onChange: function (e) {
                                var raw = e.target.value.replace(/\D/g, "");
                                setMonto(raw);
                            }, InputProps: {
                                startAdornment: ((0, jsx_runtime_1.jsx)("span", { style: { marginRight: 6, fontWeight: 600 }, children: "$" })),
                            }, sx: {
                                mt: 1,
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                },
                            } }) })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { sx: {
                    px: 3,
                    pb: 3,
                    display: "flex",
                    justifyContent: "space-between",
                }, children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: function () { return navigate("/admin/home"); }, variant: "outlined", sx: { borderRadius: 2, textTransform: "none" }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: onAbrir, sx: {
                            borderRadius: 2,
                            textTransform: "none",
                            px: 3,
                            fontWeight: 600,
                        }, children: "Abrir Caja" })] })] }));
};
exports.AperturaCajaModal = AperturaCajaModal;
