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
exports.CrearClienteModal = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var CrearClienteModal = function (_a) {
    var open = _a.open, onClose = _a.onClose, onCreated = _a.onCreated;
    var _b = (0, react_1.useState)({
        tipo_identificacion: "CC",
        identificacion: "",
        nombres: "",
        apellidos: "",
        tipo: "Cliente",
        email: "",
        telefono: "",
        direccion: "",
        nota: "",
    }), form = _b[0], setForm = _b[1];
    var handleChange = function (field, value) {
        setForm(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    var handleSave = function () {
        // Aquí llamas tu API
        onCreated(form);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: "Crear Cliente / Empresa" }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { dividers: true, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 2, mt: 1, children: [(0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, label: "Tipo Identificaci\u00F3n", value: form.tipo_identificacion, onChange: function (e) { return handleChange("tipo_identificacion", e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "CC", children: "C\u00E9dula" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "CE", children: "C\u00E9dula Extranjera" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "NIT", children: "NIT" })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Identificaci\u00F3n", value: form.identificacion, onChange: function (e) { return handleChange("identificacion", e.target.value); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombres", value: form.nombres, onChange: function (e) { return handleChange("nombres", e.target.value); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Apellidos", value: form.apellidos, onChange: function (e) { return handleChange("apellidos", e.target.value); } }), (0, jsx_runtime_1.jsxs)(material_1.TextField, { select: true, label: "Tipo", value: form.tipo, onChange: function (e) { return handleChange("tipo", e.target.value); }, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "Cliente", children: "Cliente" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "Empresa", children: "Empresa" })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Email", value: form.email, onChange: function (e) { return handleChange("email", e.target.value); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Tel\u00E9fono", value: form.telefono, onChange: function (e) { return handleChange("telefono", e.target.value); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Direcci\u00F3n", value: form.direccion, onChange: function (e) { return handleChange("direccion", e.target.value); } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nota", multiline: true, rows: 2, value: form.nota, onChange: function (e) { return handleChange("nota", e.target.value); } })] }) }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: onClose, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: handleSave, children: "Guardar" })] })] }));
};
exports.CrearClienteModal = CrearClienteModal;
