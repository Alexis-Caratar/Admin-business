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
var material_1 = require("@mui/material");
var react_router_dom_1 = require("react-router-dom");
var MenuOpen_1 = require("@mui/icons-material/MenuOpen");
var Menu_1 = require("@mui/icons-material/Menu");
var Notifications_1 = require("@mui/icons-material/Notifications");
var Restore_1 = require("@mui/icons-material/Restore");
var Storefront_1 = require("@mui/icons-material/Storefront");
var Logout_1 = require("@mui/icons-material/Logout");
var ArrowDropDown_1 = require("@mui/icons-material/ArrowDropDown");
var menusistema_1 = require("../api/menusistema");
var mapIcons_1 = require("../utils/mapIcons");
var mapComponents_1 = require("../utils/mapComponents");
var FONT = "\"Inter\", \"Roboto\", sans-serif";
var DEFAULT_AVATAR = "https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png";
var AdminDashboard = function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var modulo = (0, react_router_dom_1.useParams)().modulo;
    var theme = (0, material_1.useTheme)();
    var isSmallScreen = (0, material_1.useMediaQuery)(theme.breakpoints.down("md"));
    var _a = (0, react_1.useState)([]), menus = _a[0], setMenus = _a[1];
    var _b = (0, react_1.useState)(false), collapsed = _b[0], setCollapsed = _b[1];
    var _c = (0, react_1.useState)(false), drawerOpen = _c[0], setDrawerOpen = _c[1];
    var _d = (0, react_1.useState)(""), setIdNegocio = _d[1];
    var _e = (0, react_1.useState)("Mi Negocio"), nombre_negocio = _e[0], setNombreNegocio = _e[1];
    var _f = (0, react_1.useState)("Administrador"), nombre = _f[0], setNombre = _f[1];
    var _g = (0, react_1.useState)("admin"), rol = _g[0], setRol = _g[1];
    var _h = (0, react_1.useState)(DEFAULT_AVATAR), imagen = _h[0], setImagen = _h[1];
    var _j = (0, react_1.useState)(null), anchorEl = _j[0], setAnchorEl = _j[1];
    var openMenu = Boolean(anchorEl);
    (0, react_1.useEffect)(function () {
        // Ajusta colapso automáticamente según tamaño de pantalla
        if (isSmallScreen) {
            setCollapsed(true);
        }
        else {
            setCollapsed(false);
            setDrawerOpen(false);
        }
    }, [isSmallScreen]);
    (0, react_1.useEffect)(function () {
        var storedIdNegocio = localStorage.getItem("id_negocio") || "";
        var storedNegocio = localStorage.getItem("nombre_negocio") || "Mi Negocio";
        var storedNombre = localStorage.getItem("nombre") || "Administrador";
        var storedRol = localStorage.getItem("rol") || "admin";
        var rawImagen = localStorage.getItem("imagen");
        var storedImagen = !rawImagen || rawImagen === "null" || rawImagen === "undefined"
            ? DEFAULT_AVATAR
            : rawImagen;
        setIdNegocio(storedIdNegocio);
        setNombreNegocio(storedNegocio);
        setNombre(storedNombre);
        setRol(storedRol);
        setImagen(storedImagen);
        var loadMenus = function () { return __awaiter(void 0, void 0, void 0, function () {
            var data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, menusistema_1.getModulos)(storedIdNegocio, storedRol)];
                    case 1:
                        data = _a.sent();
                        setMenus(data);
                        if (!modulo && data.length > 0) {
                            navigate("/admin/".concat(data[0].url));
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        loadMenus();
    }, []);
    var safeImage = function (img) {
        if (!img || img === "null" || img === "undefined") {
            return DEFAULT_AVATAR;
        }
        return img;
    };
    var ActiveComponent = modulo ? mapComponents_1.componentMap[modulo] : null;
    // Contenido del sidebar
    var sidebarContent = ((0, jsx_runtime_1.jsxs)(material_1.Paper, { elevation: 0, sx: {
            width: collapsed ? 60 : 220,
            transition: "width 0.3s",
            bgcolor: "#25313F",
            color: "#9AA7B6",
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONT,
        }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", justifyContent: "space-between", p: 2, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", alignItems: "center", gap: 1, children: [(0, jsx_runtime_1.jsx)(Storefront_1.default, { sx: { color: "#FFFFFF", fontSize: 20 } }), !collapsed && ((0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "subtitle2", sx: { fontWeight: 600, color: "#FFFFFF", fontFamily: FONT }, children: nombre_negocio }))] }), !isSmallScreen && ((0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", sx: { color: "#9AA7B6" }, onClick: function () { return setCollapsed(!collapsed); }, children: collapsed ? (0, jsx_runtime_1.jsx)(Menu_1.default, {}) : (0, jsx_runtime_1.jsx)(MenuOpen_1.default, {}) }))] }), (0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", flexDirection: "column", alignItems: "center", p: 2, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: safeImage(imagen), sx: { width: 50, height: 50, mb: collapsed ? 0 : 1 }, children: nombre === null || nombre === void 0 ? void 0 : nombre.charAt(0).toUpperCase() }), !collapsed && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "body2", sx: { color: "#FFFFFF" }, children: nombre }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "caption", sx: { color: "#9AA7B6" }, children: rol })] }))] }), (0, jsx_runtime_1.jsx)(material_1.Divider, { sx: { borderColor: "rgba(255,255,255,0.1)" } }), (0, jsx_runtime_1.jsx)(material_1.List, { sx: { flex: 1, p: 0 }, children: menus.map(function (menu) {
                    var _a, _b;
                    var selected = modulo === menu.url;
                    return ((0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: collapsed ? menu.nombre : "", placement: "right", arrow: true, children: (0, jsx_runtime_1.jsxs)(material_1.ListItemButton, { selected: selected, onClick: function () {
                                navigate("/admin/".concat(menu.url));
                                if (isSmallScreen)
                                    setDrawerOpen(false);
                            }, sx: {
                                mb: 1,
                                borderRadius: 1,
                                px: 2,
                                color: selected ? "#FFFFFF" : "#9AA7B6",
                                "& .MuiListItemIcon-root": {
                                    color: selected ? "#FFFFFF" : "#9AA7B6",
                                    minWidth: 40,
                                },
                                "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.08)" },
                                "&:hover": {
                                    bgcolor: "rgba(255,255,255,0.12)",
                                    color: "#FFFFFF",
                                    "& .MuiListItemIcon-root": { color: "#FFFFFF" },
                                },
                            }, children: [(0, jsx_runtime_1.jsx)(material_1.ListItemIcon, { sx: { justifyContent: "center" }, children: (_b = mapIcons_1.iconMap[(_a = menu.icono) !== null && _a !== void 0 ? _a : "default"]) !== null && _b !== void 0 ? _b : (0, jsx_runtime_1.jsx)(Menu_1.default, {}) }), !collapsed && ((0, jsx_runtime_1.jsx)(material_1.ListItemText, { primary: menu.nombre, sx: {
                                        ml: 2,
                                        ".MuiTypography-root": { fontFamily: FONT, fontSize: 14 },
                                    } }))] }, menu.id) }));
                }) })] }));
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { display: "flex", height: "100vh", width: "100vw", children: [!isSmallScreen && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                    width: collapsed ? 60 : 220,
                    transition: "width 0.3s",
                }, children: sidebarContent })), isSmallScreen && ((0, jsx_runtime_1.jsx)(material_1.Drawer, { open: drawerOpen, onClose: function () { return setDrawerOpen(false); }, variant: "temporary", ModalProps: { keepMounted: true }, children: sidebarContent })), (0, jsx_runtime_1.jsxs)(material_1.Box, { flex: 1, display: "flex", flexDirection: "column", bgcolor: "#f3f4f6", children: [(0, jsx_runtime_1.jsx)(material_1.AppBar, { position: "static", sx: { bgcolor: "#25313F", boxShadow: "none", fontFamily: FONT }, children: (0, jsx_runtime_1.jsxs)(material_1.Toolbar, { sx: { display: "flex", justifyContent: "space-between", gap: 1 }, children: [isSmallScreen && ((0, jsx_runtime_1.jsx)(material_1.IconButton, { size: "small", sx: { color: "#9AA7B6" }, onClick: function () { return setDrawerOpen(true); }, children: (0, jsx_runtime_1.jsx)(Menu_1.default, {}) })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", gap: 1, ml: "auto", alignItems: "center" }, children: [(0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Notificaciones", children: (0, jsx_runtime_1.jsx)(material_1.IconButton, { sx: { color: "#9AA7B6" }, children: (0, jsx_runtime_1.jsx)(Notifications_1.default, {}) }) }), (0, jsx_runtime_1.jsx)(material_1.Tooltip, { title: "Restaurar contrase\u00F1a", children: (0, jsx_runtime_1.jsx)(material_1.IconButton, { sx: { color: "#9AA7B6" }, children: (0, jsx_runtime_1.jsx)(Restore_1.default, {}) }) }), (0, jsx_runtime_1.jsxs)(material_1.IconButton, { onClick: function (e) { return setAnchorEl(e.currentTarget); }, sx: { p: 0 }, children: [(0, jsx_runtime_1.jsx)(material_1.Avatar, { src: imagen, children: nombre.charAt(0) }), (0, jsx_runtime_1.jsx)(ArrowDropDown_1.default, { sx: { color: "#FFFFFF" } })] }), (0, jsx_runtime_1.jsx)(material_1.Menu, { anchorEl: anchorEl, open: openMenu, onClose: function () { return setAnchorEl(null); }, anchorOrigin: {
                                                vertical: "bottom",
                                                horizontal: "right",
                                            }, transformOrigin: {
                                                vertical: "top",
                                                horizontal: "right",
                                            }, children: (0, jsx_runtime_1.jsxs)(material_1.MenuItem, { onClick: function () {
                                                    localStorage.clear();
                                                    window.location.href = "/login";
                                                }, children: [(0, jsx_runtime_1.jsx)(Logout_1.default, { sx: { mr: 1 } }), " Salir"] }) })] })] }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { flex: 1, sx: { width: "auto", overflow: "auto", p: 3 }, children: (0, jsx_runtime_1.jsx)(material_1.Paper, { elevation: 3, sx: { p: 3 }, children: ActiveComponent ? (0, jsx_runtime_1.jsx)(ActiveComponent, {}) : (0, jsx_runtime_1.jsx)("h2", { children: "M\u00F3dulo no encontrado" }) }) })] })] }));
};
exports.default = AdminDashboard;
