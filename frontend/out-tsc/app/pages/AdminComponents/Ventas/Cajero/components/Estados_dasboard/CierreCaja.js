"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CierreCajaModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var PointOfSale_1 = require("@mui/icons-material/PointOfSale");
var WarningAmber_1 = require("@mui/icons-material/WarningAmber");
var Receipt_1 = require("@mui/icons-material/Receipt");
var Restaurant_1 = require("@mui/icons-material/Restaurant");
var CierreCajaModal = function (_a) {
    var _b, _c, _d;
    var open = _a.open, onClose = _a.onClose, arqueoInfo = _a.arqueoInfo, onCerrar = _a.onCerrar, formatCOP = _a.formatCOP;
    var _e = (0, react_1.useState)(""), dineroContado = _e[0], setDineroContado = _e[1];
    var _f = (0, react_1.useState)(""), baseCaja = _f[0], setBaseCaja = _f[1];
    var _g = (0, react_1.useState)(""), observacion = _g[0], setObservacion = _g[1];
    // Para la sub-modal de facturas pendientes
    var _h = (0, react_1.useState)([]), facturasPendientes = _h[0], setFacturasPendientes = _h[1];
    var _j = (0, react_1.useState)([]), mesasOcupadas = _j[0], setMesasOcupadas = _j[1];
    var _k = (0, react_1.useState)(false), alertaAbierta = _k[0], setAlertaAbierta = _k[1]; // controla la modal combinada
    /* DINERO ESPERADO */
    var ventas = (_b = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.total_ventas) !== null && _b !== void 0 ? _b : 0;
    var egresos = (_c = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.total_egresos) !== null && _c !== void 0 ? _c : 0;
    var montoInicial = (_d = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.monto_inicial) !== null && _d !== void 0 ? _d : 0;
    var dineroEsperado = (0, react_1.useMemo)(function () { return Number(montoInicial) + Number(ventas) - Number(egresos); }, [ventas, egresos, montoInicial]);
    var ventaLibre = (0, react_1.useMemo)(function () { return (dineroContado === "" || baseCaja === "" ? 0 : Number(dineroContado) - Number(baseCaja)); }, [dineroContado, baseCaja]);
    var diferencia = (0, react_1.useMemo)(function () { return (dineroContado === "" ? 0 : Number(dineroContado) - dineroEsperado); }, [dineroContado, dineroEsperado]);
    (0, react_1.useEffect)(function () {
        var _a, _b, _c, _d, _e, _f;
        if (!open)
            return; // Solo cuando la modal de cierre de caja se abre
        // Si hay facturas pendientes o mesas ocupadas, abrimos la modal combinada
        if (((_b = (_a = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.facturasPendientes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0 || ((_d = (_c = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.mesasOcupadas) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) > 0) {
            setFacturasPendientes((_e = arqueoInfo.facturasPendientes) !== null && _e !== void 0 ? _e : []);
            setMesasOcupadas((_f = arqueoInfo.mesasOcupadas) !== null && _f !== void 0 ? _f : []);
            setAlertaAbierta(true); // Abrimos la modal combinada
        }
        else {
            setAlertaAbierta(false); // Cerramos por seguridad si no hay nada pendiente
        }
    }, [open, arqueoInfo]);
    var puedeCerrarCaja = function (arqueoInfo) {
        var _a, _b, _c, _d;
        return (((_b = (_a = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.facturasPendientes) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) === 0 &&
            ((_d = (_c = arqueoInfo === null || arqueoInfo === void 0 ? void 0 : arqueoInfo.mesasOcupadas) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0) === 0);
    };
    var _l = (0, react_1.useState)(false), confirmAbierta = _l[0], setConfirmAbierta = _l[1];
    var handleConfirmarCierre = function () {
        var cierreData = {
            dinero_esperado: dineroEsperado,
            dinero_contado: dineroContado,
            diferencia: diferencia,
            base_caja: baseCaja,
            venta_libre: ventaLibre,
            observacion: observacion
        };
        onCerrar(cierreData);
        // Limpiar campos
        setDineroContado("");
        setBaseCaja("");
        setObservacion("");
        setConfirmAbierta(false);
    };
    var camposValidos = function () {
        return dineroContado !== "" && baseCaja !== "";
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: onClose, maxWidth: "sm", fullWidth: true, children: [(0, jsx_runtime_1.jsxs)(material_1.DialogTitle, { sx: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            borderBottom: "1px solid #e0e0e0",
                            pb: 1,
                            mb: 2
                        }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", alignItems: "center", gap: 1 }, children: [(0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 32, color: "warning.main" } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { fontWeight: "bold", fontSize: 18 }, children: "Arqueo y Cierre de Caja" })] }), (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: function () { return onClose(); }, sx: {
                                    minWidth: 0,
                                    padding: 0,
                                    color: "grey.500",
                                    fontSize: 20,
                                    lineHeight: 1,
                                    "&:hover": { backgroundColor: "transparent", color: "error.main" }
                                }, children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: { p: 2, borderRadius: 3, bgcolor: "#f8f9fa", mb: 3 }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "Monto inicial" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: formatCOP(montoInicial) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "Ventas" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, color: "success.main", children: formatCOP(ventas) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { color: "text.secondary", children: "Egresos" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, color: "error.main", children: ["- ", formatCOP(egresos)] })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Dinero esperado en caja" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 18, children: formatCOP(dineroEsperado) })] })] }) }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, type: "text", label: "Dinero contado en caja", placeholder: "Ingrese el dinero contado", value: dineroContado === "" ? "" : formatCOP(Number(dineroContado)), onChange: function (e) {
                                    var valor = e.target.value.replace(/\D/g, ""); // solo números
                                    setDineroContado(valor === "" ? "" : Number(valor));
                                }, sx: { mb: 2 } }), dineroContado !== "" && ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: diferencia === 0
                                        ? "#e8f5e9"
                                        : diferencia > 0
                                            ? "#e3f2fd"
                                            : "#ffebee",
                                    mb: 2
                                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, children: ["Diferencia: ", formatCOP(diferencia)] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: [diferencia === 0 && "Caja exacta", diferencia > 0 && "Sobrante de caja", diferencia < 0 && "Faltante de caja"] })] })), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, type: "text", label: "Base que queda en caja", placeholder: "Ej: $ 50.000", value: baseCaja === "" ? "" : formatCOP(Number(baseCaja)), onChange: function (e) {
                                    var valor = e.target.value.replace(/\D/g, "");
                                    setBaseCaja(valor === "" ? "" : Number(valor));
                                }, sx: { mb: 2 } }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: "#f5f5f5",
                                    mt: 1
                                }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: "Venta libre / Retiro de caja" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, fontSize: 18, color: "success.main", children: formatCOP(ventaLibre) })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { fullWidth: true, multiline: true, rows: 3, label: "Observaciones", placeholder: "Notas del cierre de caja...", value: observacion, onChange: function (e) { return setObservacion(e.target.value); } })] }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { px: 3, pb: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: puedeCerrarCaja(arqueoInfo) && camposValidos() ? function () { return setConfirmAbierta(true); } : undefined, sx: {
                                mt: 3,
                                p: 2,
                                borderRadius: 3,
                                background: puedeCerrarCaja(arqueoInfo) && camposValidos()
                                    ? "linear-gradient(135deg, #09a58e, #2e7d32)"
                                    : "#9e9e9e",
                                color: "#fff",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1,
                                cursor: puedeCerrarCaja(arqueoInfo) && camposValidos() ? "pointer" : "not-allowed",
                                userSelect: "none",
                                fontWeight: 700,
                                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                transition: "all 0.25s ease",
                                width: { xs: "90%", sm: "70%", md: "50%" },
                                mx: "auto",
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                "&:hover": puedeCerrarCaja(arqueoInfo) && camposValidos()
                                    ? { transform: "translateY(-4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.35)" }
                                    : {},
                                "&:active": { transform: "scale(0.97)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }
                            }, children: [(0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 20 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, letterSpacing: 0.5, children: "Cerrar Caja" })] }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: alertaAbierta, onClose: function (reason) {
                    if (reason === "backdropClick" || reason === "escapeKeyDown") {
                        return; // bloquea cerrar por fuera o con ESC
                    }
                    setAlertaAbierta(false);
                }, disableEscapeKeyDown: true, maxWidth: "sm", fullWidth: true, children: [(0, jsx_runtime_1.jsxs)(material_1.DialogTitle, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(WarningAmber_1.default, { sx: { color: 'warning.main', fontSize: 32 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { fontWeight: 'bold', fontSize: 18 }, children: "Atenci\u00F3n" })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { mt: 1 }, children: [facturasPendientes.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { fontWeight: 'bold', mb: 1 }, children: "Facturas Pendientes:" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { maxHeight: 200, overflowY: 'auto', mb: 2 }, children: facturasPendientes.map(function (f) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 2,
                                                mb: 1,
                                                borderRadius: 2,
                                                bgcolor: 'grey.100',
                                                boxShadow: 1
                                            }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'primary.main', width: 40, height: 40 }, children: (0, jsx_runtime_1.jsx)(Receipt_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, children: [f.numero_factura, " - ", f.nombre] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 13, children: ["Total: $", Number(f.total).toLocaleString()] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: ["M\u00E9todo: ", f.metodo_pago] })] })] }, f.id)); }) })] })), mesasOcupadas.length > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { fontWeight: 'bold', mb: 1 }, children: "Mesas Ocupadas:" }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { maxHeight: 200, overflowY: 'auto' }, children: mesasOcupadas.map(function (mesa) { return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 1.5,
                                                mb: 1,
                                                borderRadius: 2,
                                                bgcolor: 'grey.100',
                                                boxShadow: 1
                                            }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'error.main', width: 40, height: 40 }, children: (0, jsx_runtime_1.jsx)(Restaurant_1.default, {}) }), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { flexGrow: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { fontWeight: 600, children: [mesa.nombre, " - ", mesa.estado] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: ["Total: $", Number(mesa.total).toLocaleString(), " | Pagado: $", Number(mesa.monto_pagado).toLocaleString()] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { fontSize: 12, color: "text.secondary", children: ["M\u00E9todo: ", mesa.metodo_pago, " | Fecha: ", new Date(mesa.fecha).toLocaleString()] })] })] }, mesa.id)); }) })] })), facturasPendientes.length === 0 && mesasOcupadas.length === 0 && ((0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { textAlign: 'center' }, children: "No hay facturas pendientes ni mesas ocupadas." }))] }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { px: 3, pb: 3, justifyContent: "center" }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: function () {
                                setAlertaAbierta(false);
                                onClose();
                            }, sx: {
                                mt: 1,
                                p: 2,
                                borderRadius: 3,
                                background: "linear-gradient(135deg, #ff6347, #d84315)", // tomate
                                color: "#fff",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1,
                                cursor: "pointer",
                                userSelect: "none",
                                fontWeight: 700,
                                letterSpacing: 0.5,
                                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                transition: "all 0.25s ease",
                                width: { xs: "95%", sm: "80%" },
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
                                    background: "linear-gradient(135deg, #ff7043, #bf360c)"
                                },
                                "&:active": {
                                    transform: "scale(0.97)",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
                                }
                            }, children: [(0, jsx_runtime_1.jsx)(WarningAmber_1.default, {}), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Aceptar" })] }) })] }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: confirmAbierta, onClose: function () { return setConfirmAbierta(false); }, maxWidth: "xs", fullWidth: true, children: [(0, jsx_runtime_1.jsxs)(material_1.DialogTitle, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [(0, jsx_runtime_1.jsx)(WarningAmber_1.default, { sx: { fontSize: 36, color: 'warning.main' } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { fontWeight: 'bold', fontSize: 18 }, children: "Confirmar Cierre de Caja" })] }), (0, jsx_runtime_1.jsx)(material_1.Button, { onClick: function () { return setConfirmAbierta(false); }, sx: { minWidth: 0, padding: 0, color: 'grey.500', fontSize: 18, lineHeight: 1 }, children: "\u2715" })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: ["Revise cuidadosamente los datos antes de confirmar el cierre de caja. ", (0, jsx_runtime_1.jsx)("strong", { children: "Una vez confirmado, no se podr\u00E1n realizar cambios." })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { p: 2, borderRadius: 3, bgcolor: '#f4f6f8', boxShadow: 1 }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1.5, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'info.main', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: "Monto inicial:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto' }, children: formatCOP(montoInicial) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'success.main', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(Receipt_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: "Ventas:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto', color: 'success.main' }, children: formatCOP(ventas) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'error.main', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(Restaurant_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 600, children: "Egresos:" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { sx: { ml: 'auto', color: 'error.main' }, children: ["- ", formatCOP(egresos)] })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'warning.main', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(WarningAmber_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Dinero esperado:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto', fontWeight: 700 }, children: formatCOP(dineroEsperado) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'secondary.main', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Dinero contado:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto', fontWeight: 700 }, children: dineroContado ? formatCOP(Number(dineroContado)) : "-" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: '#9c27b0', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(WarningAmber_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Diferencia:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: {
                                                        ml: 'auto',
                                                        fontWeight: 700,
                                                        color: diferencia === 0 ? 'success.main' : diferencia > 0 ? 'info.main' : 'error.main',
                                                    }, children: formatCOP(diferencia) })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'grey.700', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Base en caja:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto', fontWeight: 700 }, children: baseCaja ? formatCOP(Number(baseCaja)) : "-" })] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { sx: { bgcolor: 'orange', width: 30, height: 30 }, children: (0, jsx_runtime_1.jsx)(Receipt_1.default, { sx: { fontSize: 18, color: 'white' } }) }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, children: "Venta libre:" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { sx: { ml: 'auto', fontWeight: 700 }, children: formatCOP(ventaLibre) })] })] }) })] }), (0, jsx_runtime_1.jsx)(material_1.Divider, {}), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: { px: 3, pb: 2 }, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: handleConfirmarCierre, sx: {
                                mt: 3,
                                p: 2,
                                borderRadius: 3,
                                background: "linear-gradient(135deg, #f5613c, #f55f5f)",
                                color: "#fff",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 1,
                                cursor: "pointer",
                                userSelect: "none",
                                fontWeight: 700,
                                boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                                transition: "all 0.25s ease",
                                width: "90%",
                                mx: "auto",
                                fontSize: { xs: "0.9rem", sm: "1rem" },
                                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.35)" },
                                "&:active": { transform: "scale(0.97)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }
                            }, children: [(0, jsx_runtime_1.jsx)(PointOfSale_1.default, { sx: { fontSize: 20 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { fontWeight: 700, letterSpacing: 0.5, children: "Confirmar Cierre" })] }) })] })] }));
};
exports.CierreCajaModal = CierreCajaModal;
