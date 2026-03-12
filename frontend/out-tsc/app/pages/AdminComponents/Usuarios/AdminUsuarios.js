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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var material_1 = require("@mui/material");
var framer_motion_1 = require("framer-motion");
var Edit_1 = require("@mui/icons-material/Edit");
var Delete_1 = require("@mui/icons-material/Delete");
var Sort_1 = require("@mui/icons-material/Sort");
var People_1 = require("@mui/icons-material/People");
var Search_1 = require("@mui/icons-material/Search");
var sweetalert2_1 = require("sweetalert2");
var usuarios_1 = require("../../../api/usuarios");
var AdminUsuarios = function () {
    var idNegocioLS = localStorage.getItem("id_negocio") || "";
    var _a = (0, react_1.useState)([]), usuarios = _a[0], setUsuarios = _a[1];
    var _b = (0, react_1.useState)(""), search = _b[0], setSearch = _b[1];
    var sortField = (0, react_1.useState)("nombres")[0];
    var _c = (0, react_1.useState)("asc"), sortOrder = _c[0], setSortOrder = _c[1];
    var _d = (0, react_1.useState)(1), page = _d[0], setPage = _d[1];
    var ITEMS_PER_PAGE = 6;
    var _e = (0, react_1.useState)(false), openModal = _e[0], setOpenModal = _e[1];
    /** FORMULARIO con tipado real */
    var _f = (0, react_1.useState)({
        id_usuario: 0,
        id_persona: 0,
        tipo_identificacion: "",
        identificacion: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        direccion: "",
        email: "",
        rol: "empleado",
        imagen: "",
    }), form = _f[0], setForm = _f[1];
    /** ============================
     * TRAER USUARIOS
     ============================ */
    var fetchUsuarios = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, usuarios_1.getUsuarios)()];
                case 1:
                    data = _a.sent();
                    setUsuarios(data);
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchUsuarios();
    }, []);
    /** ============================
     *  BUSCADOR + ORDENAMIENTO
     ============================ */
    var filtered = (0, react_1.useMemo)(function () {
        var result = __spreadArray([], usuarios, true);
        if (search.trim() !== "") {
            var term_1 = search.toLowerCase();
            result = result.filter(function (u) {
                var _a, _b, _c, _d, _e, _f;
                var fullName = "".concat((_a = u.nombres) !== null && _a !== void 0 ? _a : "", " ").concat((_b = u.apellidos) !== null && _b !== void 0 ? _b : "").concat((_c = u.rol) !== null && _c !== void 0 ? _c : "", " ").concat((_d = u.identificacion) !== null && _d !== void 0 ? _d : "", " ").toLowerCase();
                var email = (_f = (_e = u.email) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== null && _f !== void 0 ? _f : "";
                return fullName.includes(term_1) || email.includes(term_1);
            });
        }
        result.sort(function (a, b) {
            var _a, _b;
            var A = ((_a = a[sortField]) !== null && _a !== void 0 ? _a : "").toString();
            var B = ((_b = b[sortField]) !== null && _b !== void 0 ? _b : "").toString();
            var cmp = A.localeCompare(B, undefined, { numeric: true });
            return sortOrder === "asc" ? cmp : -cmp;
        });
        return result;
    }, [usuarios, search, sortField, sortOrder]);
    /** PAGINACIÓN */
    var totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    var paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    /** ============================
     * FORM CHANGE
     ============================ */
    var handleChange = function (e) {
        var _a;
        setForm(__assign(__assign({}, form), (_a = {}, _a[e.target.name] = e.target.value, _a)));
    };
    /** ============================
     * GUARDAR / ACTUALIZAR
     ============================ */
    var handleSubmit = function () { return __awaiter(void 0, void 0, void 0, function () {
        var ultimos4, nombresUsuario, email, password, payload, payload, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!(form.id_usuario === 0)) return [3 /*break*/, 2];
                    if (!form.identificacion || !form.nombres || !form.apellidos) {
                        sweetalert2_1.default.fire("Error", "Todos los campos son obligatorios", "error");
                        return [2 /*return*/];
                    }
                    ultimos4 = form.identificacion.slice(-4);
                    nombresUsuario = "".concat(form.nombres.split(" ")[0]).concat(ultimos4)
                        .replace(/ /g, "")
                        .toLowerCase();
                    email = "".concat(nombresUsuario, "@gmail.com");
                    password = ultimos4;
                    console.log("form", form);
                    payload = {
                        persona: {
                            tipo_identificacion: form.tipo_identificacion,
                            identificacion: form.identificacion,
                            nombres: form.nombres,
                            apellidos: form.apellidos,
                            telefono: form.telefono || null,
                            direccion: form.direccion || null,
                        },
                        usuario: {
                            email: email,
                            password: password,
                            rol: form.rol,
                            id_negocio: idNegocioLS,
                            imagen: form.imagen || null,
                        },
                    };
                    return [4 /*yield*/, (0, usuarios_1.createUsuarioCompleto)(payload)];
                case 1:
                    _a.sent();
                    sweetalert2_1.default.fire("Éxito", "Usuario creado correctamente", "success");
                    return [3 /*break*/, 4];
                case 2:
                    payload = {
                        persona: {
                            id: form.id_persona,
                            tipo_identificacion: form.tipo_identificacion,
                            identificacion: form.identificacion,
                            nombres: form.nombres,
                            apellidos: form.apellidos,
                            telefono: form.telefono,
                            direccion: form.direccion,
                        },
                        usuario: {
                            id: form.id_usuario,
                            email: form.email,
                            rol: form.rol,
                            imagen: form.imagen,
                            password: '12345'
                        },
                    };
                    return [4 /*yield*/, (0, usuarios_1.updateUsuarioCompleto)(payload)];
                case 3:
                    _a.sent();
                    sweetalert2_1.default.fire("Éxito", "Usuario actualizado correctamente", "success");
                    _a.label = 4;
                case 4:
                    setOpenModal(false);
                    fetchUsuarios();
                    return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    sweetalert2_1.default.fire("Error", err_1.message || "Error al guardar", "error");
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    /** ============================
     * ELIMINAR
     ============================ */
    var handleDeleteUser = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            sweetalert2_1.default.fire({
                title: "¿Está seguro?",
                text: "Esta acción eliminará el usuario permanentemente.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
            }).then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!result.isConfirmed) return [3 /*break*/, 4];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, (0, usuarios_1.deleteUsuario)(id)];
                        case 2:
                            _b.sent();
                            fetchUsuarios();
                            sweetalert2_1.default.fire("Eliminado", "Usuario eliminado correctamente", "success");
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            sweetalert2_1.default.fire("Error", "No se pudo eliminar el usuario", "error");
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    }); };
    /** ============================
     * ANIMACIONES TARJETAS
     ============================ */
    var cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    };
    /** ============================
     * CARGAR DATOS EN EDICIÓN
     ============================ */
    var handleEdit = function (u) {
        setForm({
            id_usuario: u.id_usuario,
            id_persona: u.id_persona,
            tipo_identificacion: u.tipo_identificacion,
            identificacion: u.identificacion,
            nombres: u.nombres,
            apellidos: u.apellidos,
            telefono: u.telefono,
            direccion: u.direccion,
            email: u.email,
            rol: u.rol,
            imagen: u.imagen || "",
        });
        setOpenModal(true);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { p: 1, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", fontWeight: 600, display: "flex", gap: 1, children: [(0, jsx_runtime_1.jsx)(People_1.default, {}), " Administrar Usuarios"] }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", startIcon: (0, jsx_runtime_1.jsx)(People_1.default, {}), onClick: function () {
                            setForm({
                                id_usuario: 0,
                                id_persona: 0,
                                tipo_identificacion: "",
                                identificacion: "",
                                nombres: "",
                                apellidos: "",
                                telefono: "",
                                direccion: "",
                                email: "",
                                rol: "empleado",
                                imagen: "",
                            });
                            setOpenModal(true);
                        }, component: framer_motion_1.motion.button, whileHover: { scale: 1.05 }, children: "Adicionar Usuario" })] }), (0, jsx_runtime_1.jsx)(material_1.Box, { mb: 3, children: (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                        display: "flex",
                        alignItems: "center",
                        background: "#f1f3f4",
                        px: 2,
                        borderRadius: 5,
                        width: 450,
                        height: 38,
                    }, children: [(0, jsx_runtime_1.jsx)(Search_1.default, { sx: { opacity: 0.6, mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.TextField, { variant: "standard", placeholder: "Buscar...", value: search, onChange: function (e) { return setSearch(e.target.value); }, InputProps: { disableUnderline: true }, fullWidth: true })] }) }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "outlined", size: "small", startIcon: (0, jsx_runtime_1.jsx)(Sort_1.default, {}), onClick: function () { return setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }, sx: { mb: 2 }, children: "Ordenar" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { mb: 2, children: ["Total: ", (0, jsx_runtime_1.jsx)("strong", { children: filtered.length }), " usuarios encontrados."] }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", flexWrap: "wrap", gap: 2, children: (0, jsx_runtime_1.jsx)(framer_motion_1.AnimatePresence, { children: paginated.map(function (u) { return ((0, jsx_runtime_1.jsx)(material_1.Box, { flex: "1 1 calc(100% - 16px)" // xs: full width
                        , sx: {
                            '@media (min-width:600px)': { flex: '1 1 calc(50% - 16px)' }, // sm: 2 por fila
                            '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 16px)' }, // md: 3 por fila
                        }, children: (0, jsx_runtime_1.jsx)(framer_motion_1.motion.div, { variants: cardVariants, initial: "hidden", animate: "visible", exit: "exit", whileHover: {
                                scale: 1.04,
                                transition: { duration: 0.25 },
                            }, children: (0, jsx_runtime_1.jsx)(material_1.Card, { sx: { borderRadius: 3 }, children: (0, jsx_runtime_1.jsxs)(material_1.CardContent, { children: [(0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", justifyContent: "center", children: (0, jsx_runtime_1.jsx)(material_1.Avatar, { src: u.imagen || "", sx: { width: 80, height: 80, fontSize: 28 }, children: !u.imagen && u.nombres.charAt(0) }) }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { align: "center", fontWeight: "bold", children: [u.nombres, " ", u.apellidos] }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { align: "center", children: [u.tipo_identificacion, "-", u.identificacion] }), (0, jsx_runtime_1.jsx)(material_1.Typography, { align: "center", children: u.email }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { align: "center", variant: "caption", fontWeight: "bold", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Rol:" }), " ", u.rol] }), (0, jsx_runtime_1.jsxs)(material_1.Stack, { direction: "row", spacing: 1, justifyContent: "center", mt: 2, children: [(0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "primary", onClick: function () { return handleEdit(u); }, children: (0, jsx_runtime_1.jsx)(Edit_1.default, {}) }), (0, jsx_runtime_1.jsx)(material_1.IconButton, { color: "error", onClick: function () { return handleDeleteUser(u.id_usuario); }, children: (0, jsx_runtime_1.jsx)(Delete_1.default, {}) })] })] }) }) }) }, u.id_usuario)); }) }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { display: "flex", justifyContent: "center", mt: 3, children: (0, jsx_runtime_1.jsx)(material_1.Pagination, { count: totalPages, page: page, onChange: function (_event, value) { return setPage(value); } }) }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openModal, onClose: function () { return setOpenModal(false); }, fullWidth: true, maxWidth: "sm", children: [(0, jsx_runtime_1.jsx)(material_1.DialogTitle, { children: form.id_usuario === 0 ? "Adicionar Usuario" : "Editar Usuario" }), (0, jsx_runtime_1.jsxs)(material_1.DialogContent, { sx: { display: "flex", flexDirection: "column", gap: 2 }, children: [(0, jsx_runtime_1.jsxs)(material_1.FormControl, { fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Tipo de Identificaci\u00F3n" }), (0, jsx_runtime_1.jsxs)(material_1.Select, { name: "tipo_identificacion", label: "Tipo de Identificaci\u00F3n", value: form.tipo_identificacion, onChange: handleChange, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "CC", children: "C\u00E9dula de Ciudadan\u00EDa" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "CE", children: "C\u00E9dula de Extranjer\u00EDa" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "VISA", children: "VISA" })] })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Identificaci\u00F3n", name: "identificacion", value: form.identificacion, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Identificaci\u00F3n", name: "identificacion", value: form.identificacion, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Nombres", name: "nombres", value: form.nombres, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Apellidos", name: "apellidos", value: form.apellidos, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Tel\u00E9fono", name: "telefono", value: form.telefono, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Direcci\u00F3n", name: "direccion", value: form.direccion, onChange: handleChange }), (0, jsx_runtime_1.jsxs)(material_1.FormControl, { fullWidth: true, children: [(0, jsx_runtime_1.jsx)(material_1.InputLabel, { children: "Rol" }), (0, jsx_runtime_1.jsxs)(material_1.Select, { name: "rol", value: form.rol, label: "Rol", onChange: handleChange, children: [(0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "admin", children: "Admin" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "cliente", children: "Cliente" }), (0, jsx_runtime_1.jsx)(material_1.MenuItem, { value: "empleado", children: "Empleado" })] })] }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "Email usuario", name: "email", value: form.email, onChange: handleChange }), (0, jsx_runtime_1.jsx)(material_1.TextField, { label: "URL Imagen (opcional)", name: "imagen", value: form.imagen, onChange: handleChange })] }), (0, jsx_runtime_1.jsxs)(material_1.DialogActions, { children: [(0, jsx_runtime_1.jsx)(material_1.Button, { onClick: function () { return setOpenModal(false); }, children: "Cancelar" }), (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: handleSubmit, children: "Guardar" })] })] })] }));
};
exports.default = AdminUsuarios;
