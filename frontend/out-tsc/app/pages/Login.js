"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var auth_1 = require("../api/auth");
var react_router_dom_1 = require("react-router-dom");
var framer_motion_1 = require("framer-motion");
var sweetalert2_1 = require("sweetalert2");
var material_1 = require("@mui/material");
var MailOutline_1 = require("@mui/icons-material/MailOutline");
var LockOutlined_1 = require("@mui/icons-material/LockOutlined");
var Login_1 = require("@mui/icons-material/Login");
var Login = function () {
    var _a = (0, react_1.useState)(""), email = _a[0], setEmail = _a[1];
    var _b = (0, react_1.useState)(""), password = _b[0], setPassword = _b[1];
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var _a, token, user, error_1;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    e.preventDefault();
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, auth_1.login)({ email: email, password: password })];
                case 2:
                    _a = _d.sent(), token = _a.token, user = _a.user;
                    localStorage.setItem("token", token);
                    localStorage.setItem("id_usuario", String(user.id));
                    localStorage.setItem("id_persona", String(user.id_persona));
                    localStorage.setItem("id_negocio", String(user.id_negocio));
                    localStorage.setItem("nombre_negocio", String(user.nombre_negocio));
                    localStorage.setItem("nombre", user.nombre);
                    localStorage.setItem("email", user.email);
                    localStorage.setItem("rol", user.rol);
                    localStorage.setItem("imagen", user.imagen);
                    navigate("/admin");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _d.sent();
                    sweetalert2_1.default.fire({
                        icon: "error",
                        title: "Acceso denegado",
                        text: ((_c = (_b = error_1.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) || "Contraseña incorrecta”",
                        confirmButtonColor: "#1d4ed8",
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
            height: "100vh",
            width: "100vw",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            background: "linear-gradient(135deg, #eef2ff, #e0e7ff, #c7d2fe)",
            fontFamily: "\"Inter\", sans-serif",
        }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.15)",
                    backdropFilter: "blur(3px)",
                } }), (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { initial: { opacity: 0, scale: 0.9, y: 40 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.6, ease: "easeOut" }, children: (0, jsx_runtime_1.jsxs)(material_1.Paper, { elevation: 8, sx: {
                        position: "relative",
                        width: 400,
                        p: 5,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                    }, children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h5", sx: { textAlign: "center", fontWeight: 700, color: "#0f172a" }, children: "Sistema Empresarial" }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", sx: { textAlign: "center", color: "#475569", mb: 2 }, children: "Accede al panel administrativo" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, style: { display: "flex", flexDirection: "column", gap: "20px" }, children: [(0, jsx_runtime_1.jsx)(material_1.TextField, { value: email, onChange: function (e) { return setEmail(e.target.value); }, placeholder: "Correo electr\u00F3nico", required: true, fullWidth: true, variant: "outlined", InputProps: {
                                        startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(MailOutline_1.default, { color: "primary" }) })),
                                    } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { value: password, onChange: function (e) { return setPassword(e.target.value); }, placeholder: "Contrase\u00F1a", type: "password", required: true, fullWidth: true, variant: "outlined", InputProps: {
                                        startAdornment: ((0, jsx_runtime_1.jsx)(material_1.InputAdornment, { position: "start", children: (0, jsx_runtime_1.jsx)(LockOutlined_1.default, { color: "primary" }) })),
                                    } }), (0, jsx_runtime_1.jsx)(material_1.Button, { type: "submit", variant: "contained", color: "primary", startIcon: (0, jsx_runtime_1.jsx)(Login_1.default, {}), sx: {
                                        py: 1.5,
                                        fontWeight: 600,
                                        fontSize: 16,
                                        textTransform: "none",
                                        boxShadow: "0 5px 15px rgba(37,78,216,0.35)",
                                        "&:hover": {
                                            boxShadow: "0 6px 18px rgba(37,78,216,0.45)",
                                        },
                                    }, children: "Ingresar" })] })] }) })] }));
};
exports.default = Login;
