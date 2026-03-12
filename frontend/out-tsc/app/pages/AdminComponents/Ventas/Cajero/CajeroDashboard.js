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
exports.CajeroDashboard = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
/* ---------- /src/pages/CajeroDashboard.tsx ---------- */
var react_1 = require("react");
var material_1 = require("@mui/material");
var ShoppingCart_1 = require("@mui/icons-material/ShoppingCart");
var cajero_1 = require("../../../../api/cajero");
var Mesas_1 = require("./components/Mesas");
var Carrito_1 = require("./components/Carrito");
var AperturaCaja_1 = require("./components/AperturaCaja");
var ArqueoCaja_1 = require("./components/Estados_dasboard/ArqueoCaja");
var CierreCaja_1 = require("./components/Estados_dasboard/CierreCaja");
var ProductosCategoria_1 = require("./components/ProductosCategoria");
var Categorias_1 = require("./components/Categorias");
var CarritoMobile_1 = require("./components/CarritoMobile");
var Egresos_1 = require("./components/Estados_dasboard/Egresos");
var Person_1 = require("@mui/icons-material/Person");
var framer_motion_1 = require("framer-motion");
var Visibility_1 = require("@mui/icons-material/Visibility");
var VisibilityOff_1 = require("@mui/icons-material/VisibilityOff");
var ventasDetalles_1 = require("./components/Estados_dasboard/ventasDetalles");
var CajaPanel_1 = require("./components/Estados_dasboard/CajaPanel");
var CheckCircle_1 = require("@mui/icons-material/CheckCircle");
var CajeroDashboard = function () {
    var _a = (0, react_1.useState)([]), categorias = _a[0], setCategorias = _a[1];
    var _b = (0, react_1.useState)(null), caja = _b[0], setCaja = _b[1];
    var _c = (0, react_1.useState)(true), loadingCategorias = _c[0], setLoadingCategorias = _c[1];
    var _d = (0, react_1.useState)(false), cajaAbierta = _d[0], setCajaAbierta = _d[1];
    var _e = (0, react_1.useState)(""), montoApertura = _e[0], setMontoApertura = _e[1];
    var _f = (0, react_1.useState)(null), idCaja = _f[0], setIdCaja = _f[1];
    var _g = (0, react_1.useState)([]), setVentas = _g[1];
    var _h = (0, react_1.useState)([]), carrito = _h[0], setCarrito = _h[1];
    var _j = (0, react_1.useState)(false), modalApertura = _j[0], setModalApertura = _j[1];
    var _k = (0, react_1.useState)(false), modalCierre = _k[0], setModalCierre = _k[1];
    var _l = (0, react_1.useState)(false), modalArqueo = _l[0], setModalArqueo = _l[1];
    var _m = (0, react_1.useState)(null), arqueoInfo = _m[0], setArqueoInfo = _m[1];
    var _o = (0, react_1.useState)(null), categoriaSeleccionada = _o[0], setCategoriaSeleccionada = _o[1];
    var _p = (0, react_1.useState)(false), modalProductosOpen = _p[0], setModalProductosOpen = _p[1];
    var _q = (0, react_1.useState)(false), openCarrito = _q[0], setOpenCarrito = _q[1];
    var _r = (0, react_1.useState)(false), openEgresos = _r[0], setOpenEgresos = _r[1];
    var _s = (0, react_1.useState)([]), mesas = _s[0], setMesas = _s[1];
    var _t = (0, react_1.useState)(null), mesaSeleccionada = _t[0], setMesaSeleccionada = _t[1];
    var theme = (0, material_1.useTheme)();
    var isMobile = (0, material_1.useMediaQuery)(theme.breakpoints.down("md"));
    var _u = (0, react_1.useState)(false), openVentaRegistrada = _u[0], setOpenVentaRegistrada = _u[1];
    var _v = (0, react_1.useState)(null), ventaPayload = _v[0], setVentaPayload = _v[1];
    var _w = (0, react_1.useState)(false), showStats = _w[0], setShowStats = _w[1]; // por defecto oculto
    var idUsuario = localStorage.getItem("id_usuario");
    var id_negocio = localStorage.getItem("id_negocio");
    var _x = (0, react_1.useState)(false), openVentasDetalles = _x[0], setOpenVentasDetalles = _x[1];
    var _y = (0, react_1.useState)(null), animItem = _y[0], setAnimItem = _y[1];
    var abrirCarrito = function () {
        setOpenCarrito(true);
    };
    var cerrarCarrito = function () { return setOpenCarrito(false); };
    (0, react_1.useEffect)(function () {
        var ws = new WebSocket(import.meta.env.VITE_WS_URL);
        ws.onopen = function () {
            console.log("WS conectado");
            ws.send(JSON.stringify({
                tipo: "suscribirse_mesas",
                id_negocio: id_negocio
            }));
            ws.send(JSON.stringify({
                tipo: "suscribirse_caja",
                id_usuario: idUsuario
            }));
        };
        ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            // MESAS
            if (msg.tipo === "mesas") {
                console.log("Mesas actualizadas", msg.mesas);
                setMesas(msg.mesas);
            }
            // CAJA
            if (msg.tipo === "actualizar_caja") {
                console.log("Mesas actualizadas", msg.caja);
                var c = msg.caja;
                if (!c)
                    return;
                setCaja(c);
                setCajaAbierta(c.estado === "ABIERTA");
                setIdCaja(c.id);
                if (msg.tipo === "actualizar_caja") {
                    var c_1 = msg.caja;
                    if (!c_1)
                        return;
                    setCaja(c_1);
                    setCajaAbierta(c_1.estado === "ABIERTA");
                    setIdCaja(c_1.id);
                    if (c_1.estado === "ABIERTA") {
                        setMontoApertura(String(c_1.monto_inicial));
                    }
                    else {
                        setMontoApertura("");
                    }
                }
            }
        };
        ws.onclose = function () { return console.log("WS cerrado"); };
        ws.onerror = function (err) { return console.error("WS error", err); };
        return function () { return ws.close(); };
    }, [id_negocio, idUsuario]);
    var checkCaja = function () { return __awaiter(void 0, void 0, void 0, function () {
        var idUsuario_1, data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    idUsuario_1 = localStorage.getItem("id_usuario");
                    return [4 /*yield*/, (0, cajero_1.estado_caja)({ id_usuario: idUsuario_1 })];
                case 1:
                    data = (_a.sent()).data;
                    if ((data === null || data === void 0 ? void 0 : data.ok) && data.estado.length > 0) {
                        setCajaAbierta(true);
                        setCaja(data.estado[0]);
                        setIdCaja(data.estado[0].id);
                        setMontoApertura(data.estado[0].monto_inicial.toString());
                    }
                    else {
                        setModalApertura(true);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.error("Error consultando estado de caja:", err_1);
                    setModalApertura(true);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        checkCaja();
    }, []);
    (0, react_1.useEffect)(function () {
        var mounted = true;
        function load() {
            return __awaiter(this, void 0, void 0, function () {
                var res, data, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, 3, 4]);
                            setLoadingCategorias(true);
                            return [4 /*yield*/, (0, cajero_1.apiListarProductos)()];
                        case 1:
                            res = _a.sent();
                            data = [];
                            if (res && res.data) {
                                if (Array.isArray(res.data))
                                    data = res.data;
                                else if (res.data.ok && res.data.productos)
                                    data = res.data.productos;
                                else if (res.data.productos)
                                    data = res.data.productos;
                            }
                            if (mounted)
                                setCategorias(data || []);
                            return [3 /*break*/, 4];
                        case 2:
                            err_2 = _a.sent();
                            console.error("Error cargando categorías y productos:", err_2);
                            return [3 /*break*/, 4];
                        case 3:
                            if (mounted)
                                setLoadingCategorias(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        load();
        return function () {
            mounted = false;
        };
    }, []);
    var getPrecio = function (p) { var _a; return Number((_a = p.precio_venta) !== null && _a !== void 0 ? _a : 0); };
    var addCart = function (p) {
        var precio = getPrecio(p);
        setCarrito(function (prev) {
            var existe = prev.find(function (x) { return x.id === p.id; });
            if (existe) {
                return prev.map(function (x) {
                    return x.id === p.id ? __assign(__assign({}, x), { cantidad: x.cantidad + 1 }) : x;
                });
            }
            return __spreadArray(__spreadArray([], prev, true), [__assign(__assign({}, p), { cantidad: 1, precio_venta: precio })], false);
        });
    };
    var sumarCantidad = function (id) {
        setCarrito(function (prev) {
            return prev.map(function (item) {
                return item.id === id
                    ? __assign(__assign({}, item), { cantidad: item.cantidad + 1 }) : item;
            });
        });
    };
    var restarCantidad = function (id) {
        setCarrito(function (prev) {
            return prev
                .map(function (item) {
                return item.id === id
                    ? __assign(__assign({}, item), { cantidad: item.cantidad - 1 }) : item;
            })
                .filter(function (item) { return item.cantidad > 0; });
        });
    };
    var removeItem = function (id) {
        setCarrito(function (prev) {
            return prev.filter(function (item) { return item.id !== id; });
        });
    };
    var clearCarrito = function () {
        setCarrito([]);
    };
    var clearMesa = function () {
        setMesaSeleccionada(null);
    };
    //Finalizar venta
    var finalizarVenta = function (cliente, datos_adicionales) { return __awaiter(void 0, void 0, void 0, function () {
        var subtotal, descuento, impuesto, total, payload, data, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (carrito.length === 0)
                        return [2 /*return*/];
                    subtotal = carrito.reduce(function (acc, v) { return acc + v.precio_venta * v.cantidad; }, 0);
                    descuento = 0;
                    impuesto = 0;
                    total = subtotal - descuento + impuesto;
                    payload = {
                        idUsuario: idUsuario,
                        id_negocio: id_negocio,
                        id_cliente: cliente ? cliente : 18,
                        id_caja: idCaja,
                        id_mesa: mesaSeleccionada === null || mesaSeleccionada === void 0 ? void 0 : mesaSeleccionada.id,
                        fecha: new Date().toISOString(),
                        subtotal: subtotal,
                        descuento: descuento,
                        descuento_porcentaje: 0,
                        impuesto: impuesto,
                        total: total,
                        estado: "PENDIENTE",
                        nota: "",
                        metodo_pago: datos_adicionales.metodo_pago,
                        monto_pagado: total,
                        monto_recibido: datos_adicionales.monto_recibido,
                        cambio: datos_adicionales.cambio,
                        productos: carrito.map(function (p) { return ({
                            id_producto: p.id,
                            cantidad: p.cantidad,
                            precio_unitario: p.precio_venta,
                            descuento: 0,
                            descuento_porcentaje: 0,
                            impuesto: 0,
                            subtotal: p.precio_venta * p.cantidad,
                        }); }),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, cajero_1.finalizar_venta)(payload)];
                case 2:
                    data = (_a.sent()).data;
                    if (data.ok) {
                        setVentas(function (prev) { return __spreadArray(__spreadArray([], prev, true), [__assign({}, payload)], false); });
                        setCarrito([]);
                        setMesaSeleccionada(null);
                        checkCaja();
                        setVentaPayload(payload);
                        closeCategoria();
                        setOpenVentaRegistrada(true);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    console.error("Error finalizando venta:", err_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    //aperturar la caja 
    var abrirCajaReal = function () { return __awaiter(void 0, void 0, void 0, function () {
        var data, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, cajero_1.apiAbrirCaja)({
                            id_usuario: idUsuario,
                            monto_inicial: Number(montoApertura)
                        })];
                case 1:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok) {
                        // limpiar estados anteriores
                        setVentas([]);
                        setCarrito([]);
                        setMesaSeleccionada(null);
                        setArqueoInfo(null);
                        // nueva caja
                        setCajaAbierta(true);
                        setCaja(data.result);
                        setIdCaja(data.result.id);
                        setModalApertura(false);
                        cargarArqueo(data.result.id);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    console.error("Error abrirCajaReal:", err_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var cargarArqueo = function (id_caja_param) { return __awaiter(void 0, void 0, void 0, function () {
        var data, err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, cajero_1.apiArqueoCaja)({ id_caja: id_caja_param !== null && id_caja_param !== void 0 ? id_caja_param : idCaja })];
                case 1:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok)
                        setArqueoInfo(data.result);
                    return [3 /*break*/, 3];
                case 2:
                    err_5 = _a.sent();
                    console.error("Error arqueo:", err_5);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var cerrarCajaReal = function (cierreData) { return __awaiter(void 0, void 0, void 0, function () {
        var dinero_esperado, dinero_contado, diferencia, base_caja, venta_libre, observacion, data, err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!idCaja) {
                        console.error("No hay una caja abierta para cerrar.");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    dinero_esperado = cierreData.dinero_esperado, dinero_contado = cierreData.dinero_contado, diferencia = cierreData.diferencia, base_caja = cierreData.base_caja, venta_libre = cierreData.venta_libre, observacion = cierreData.observacion;
                    return [4 /*yield*/, (0, cajero_1.apiCerrarCaja)({
                            id_caja: idCaja,
                            monto_final: dinero_contado,
                            dinero_esperado: dinero_esperado,
                            base_caja: base_caja,
                            venta_libre: venta_libre,
                            diferencia: diferencia,
                            nota: observacion,
                            estado: "CERRADA"
                        })];
                case 2:
                    data = (_a.sent()).data;
                    if (data === null || data === void 0 ? void 0 : data.ok) {
                        // Limpiar estados locales
                        setCajaAbierta(false);
                        setVentas([]);
                        setCarrito([]);
                        setMontoApertura("");
                        setIdCaja(null);
                        setModalCierre(false);
                        checkCaja(); // refresca la información
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_6 = _a.sent();
                    console.error("Error cerrarCajaReal:", err_6);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var openCategoria = function (categoria) {
        setCategoriaSeleccionada(categoria);
        setModalProductosOpen(true);
    };
    var closeCategoria = function () {
        setCategoriaSeleccionada(null);
        setModalProductosOpen(false);
    };
    // utils/format.ts
    var formatCOP = function (value) {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };
    var animarAlCarrito = function (img, rect) {
        setAnimItem({ img: img, start: rect });
        setTimeout(function () {
            setAnimItem(null);
        }, 700);
    };
    return ((0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { height: "100vh", display: "flex", flexDirection: "column", p: 0, ml: 0 }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { onClick: function () { return setShowStats(function (prev) { return !prev; }); }, sx: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderRadius: 4,
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.12)",
                    p: 1.5,
                    backgroundColor: cajaAbierta ? "success.main" : "error.main",
                    color: "white",
                    cursor: "pointer",
                    userSelect: "none",
                    transition: "all 0.25s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0px 8px 25px rgba(0,0,0,0.2)"
                    }
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                            display: "flex",
                            alignItems: "center"
                        }, children: [(0, jsx_runtime_1.jsx)(Person_1.default, { sx: { mr: 1 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", children: "Perfil del Cajero" })] }), showStats ? (0, jsx_runtime_1.jsx)(VisibilityOff_1.default, {}) : (0, jsx_runtime_1.jsx)(Visibility_1.default, {})] }), cajaAbierta && ((0, jsx_runtime_1.jsx)(CajaPanel_1.default, { showStats: showStats, cajaAbierta: cajaAbierta, caja: caja, formatCOP: formatCOP, onVentas: function () { return setOpenVentasDetalles(true); }, onEgresos: function () { return setOpenEgresos(true); }, onArqueo: function () {
                    setModalArqueo(true);
                    cargarArqueo();
                }, onCerrar: function () {
                    setModalCierre(true);
                    cargarArqueo();
                } })), (0, jsx_runtime_1.jsxs)(material_1.Box, { sx: { display: "flex", flex: 1, minHeight: 0 }, children: [(0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                            width: { xs: "35%", sm: "35%", md: "30%" },
                            borderRight: { xs: "none", md: "1px solid #e0e0e0" },
                            pr: { xs: 0, md: 1 },
                            mb: { xs: 2, md: 0 }, // margen inferior en móvil
                            display: "flex",
                            flexDirection: "column",
                            overflowY: "auto",
                            maxHeight: "100%",
                        }, children: (0, jsx_runtime_1.jsx)(Categorias_1.Categorias, { categorias: categorias, loading: loadingCategorias, onOpen: openCategoria, modo: "dashboard" }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                            width: { xs: "100%", sm: "100%", md: "80%" }, // 🔥 MÓVIL 100% - ESCRITORIO 50%
                            px: 1,
                            display: "flex",
                            flexDirection: "column",
                            overflowY: "auto",
                            maxHeight: "100%",
                        }, children: (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { flex: 1 }, children: (0, jsx_runtime_1.jsx)(Mesas_1.Mesas, { idUsuario: Number(idUsuario) || 0, id_negocio: Number(id_negocio) || 0, mesas: mesas, mesaSeleccionada: mesaSeleccionada, onSelect: function (m) {
                                    return setMesaSeleccionada(function (prev) { return ((prev === null || prev === void 0 ? void 0 : prev.id) === (m === null || m === void 0 ? void 0 : m.id) ? null : m); });
                                } }) }) }), !openCarrito && !isMobile && ((0, jsx_runtime_1.jsx)(material_1.Box, { component: framer_motion_1.motion.div, initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 }, sx: {
                            position: "fixed",
                            bottom: 24,
                            right: 24,
                            zIndex: 1400,
                        }, children: (0, jsx_runtime_1.jsxs)(material_1.Fab, { color: "primary", variant: "extended", onClick: abrirCarrito, sx: { position: "relative" }, children: [(0, jsx_runtime_1.jsx)(material_1.Badge, { badgeContent: carrito.reduce(function (total, item) { return total + item.cantidad; }, 0), color: "error", sx: {
                                        "& .MuiBadge-badge": {
                                            fontWeight: "bold",
                                        },
                                    }, children: (0, jsx_runtime_1.jsx)(ShoppingCart_1.default, { sx: { mr: 1 } }) }), "Ver Carrito"] }) })), !openCarrito && isMobile && ((0, jsx_runtime_1.jsx)(material_1.Box, { sx: {
                            position: "fixed",
                            bottom: 20,
                            right: 20,
                            zIndex: 1400,
                        }, children: (0, jsx_runtime_1.jsx)(material_1.Badge, { badgeContent: carrito.length, color: "error", children: (0, jsx_runtime_1.jsx)(material_1.Fab, { color: "primary", onClick: abrirCarrito, children: (0, jsx_runtime_1.jsx)(ShoppingCart_1.default, {}) }) }) })), (0, jsx_runtime_1.jsx)(material_1.Drawer, { anchor: "right", open: openCarrito && !isMobile, onClose: function () { return setOpenCarrito(false); }, sx: {
                            "& .MuiDrawer-paper": { width: 400, p: 2, boxSizing: "border-box" },
                        }, children: (0, jsx_runtime_1.jsx)(Carrito_1.Carrito, { carrito: carrito, onRemove: removeItem, onClear: clearCarrito, onAdd: sumarCantidad, onSub: restarCantidad, onFinalizar: function (c, p) {
                                finalizarVenta(c, p);
                                setOpenCarrito(false);
                            }, mesaSeleccionada: mesaSeleccionada, onClearMesa: clearMesa, categorias: categorias, onOpenCategoria: function (categoria) {
                                setOpenCarrito(false);
                                openCategoria(categoria);
                            }, loadingCategorias: loadingCategorias }) }), (0, jsx_runtime_1.jsx)(material_1.Box, { sx: { display: { xs: "block", md: "none" } }, children: isMobile && ((0, jsx_runtime_1.jsx)(CarritoMobile_1.CarritoMobile, { open: openCarrito, onClose: cerrarCarrito, carrito: carrito, onRemove: removeItem, onClear: clearCarrito, onAdd: sumarCantidad, onSub: restarCantidad, onFinalizar: function (c, p) {
                                finalizarVenta(c, p);
                                setOpenCarrito(false);
                            }, mesaSeleccionada: mesaSeleccionada, onClearMesa: clearMesa, categorias: categorias, onOpenCategoria: function (categoria) {
                                setOpenCarrito(false);
                                openCategoria(categoria);
                            }, loadingCategorias: loadingCategorias })) })] }), (0, jsx_runtime_1.jsx)(AperturaCaja_1.AperturaCajaModal, { open: modalApertura, onClose: function () { return setModalApertura(false); }, monto: montoApertura, setMonto: setMontoApertura, onAbrir: abrirCajaReal }), (0, jsx_runtime_1.jsx)(ArqueoCaja_1.ArqueoCajaModal, { open: modalArqueo, onClose: function () { return setModalArqueo(false); }, arqueoInfo: arqueoInfo }), (0, jsx_runtime_1.jsx)(CierreCaja_1.CierreCajaModal, { open: modalCierre, onClose: function () { return setModalCierre(false); }, arqueoInfo: arqueoInfo, formatCOP: formatCOP, onCerrar: cerrarCajaReal }), (0, jsx_runtime_1.jsx)(ProductosCategoria_1.ProductosCategoriaModal, { open: modalProductosOpen, onClose: closeCategoria, categoria: categoriaSeleccionada, categorias: categorias, onAgregar: addCart, animarAlCarrito: animarAlCarrito }), (0, jsx_runtime_1.jsx)(Egresos_1.default, { open: openEgresos, onClose: function () { return setOpenEgresos(false); }, idUsuario: idUsuario != null ? Number(idUsuario) : null, id_negocio: id_negocio != null ? Number(id_negocio) : null, id_caja: idCaja }), (0, jsx_runtime_1.jsx)(ventasDetalles_1.default, { open: openVentasDetalles, onClose: function () { return setOpenVentasDetalles(false); }, id_caja: idCaja }), (0, jsx_runtime_1.jsxs)(material_1.Dialog, { open: openVentaRegistrada, onClose: function () { return setOpenVentaRegistrada(false); }, PaperProps: {
                    sx: {
                        borderRadius: 4,
                        overflow: "hidden",
                        minWidth: 380,
                        maxWidth: 420,
                        boxShadow: "0 15px 40px rgba(0,0,0,0.12)"
                    }
                }, children: [(0, jsx_runtime_1.jsxs)(material_1.Box, { sx: {
                            background: "linear-gradient(135deg,#16a34a,#22c55e)",
                            color: "white",
                            py: 3,
                            px: 2,
                            textAlign: "center"
                        }, children: [(0, jsx_runtime_1.jsx)(CheckCircle_1.default, { sx: { fontSize: 48 } }), (0, jsx_runtime_1.jsx)(material_1.Typography, { variant: "h6", fontWeight: "bold", children: "Venta registrada con \u00E9xito" })] }), (0, jsx_runtime_1.jsx)(material_1.DialogContent, { sx: { textAlign: "center", py: 3 }, children: ventaPayload && ((0, jsx_runtime_1.jsx)(material_1.Paper, { elevation: 0, sx: {
                                p: 2,
                                borderRadius: 3,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0"
                            }, children: (0, jsx_runtime_1.jsxs)(material_1.Stack, { spacing: 1, alignItems: "center", children: [(0, jsx_runtime_1.jsx)(material_1.Typography, { fontSize: 13, color: "text.secondary", children: "Total de la venta" }), (0, jsx_runtime_1.jsxs)(material_1.Typography, { variant: "h5", fontWeight: "bold", color: "success.main", children: ["$", ventaPayload.total.toLocaleString()] }), (0, jsx_runtime_1.jsx)(material_1.Chip, { label: "Pago: ".concat(ventaPayload.metodo_pago), color: "success", size: "small", sx: { fontWeight: 500 } })] }) })) }), (0, jsx_runtime_1.jsx)(material_1.DialogActions, { sx: {
                            justifyContent: "center",
                            pb: 3
                        }, children: (0, jsx_runtime_1.jsx)(material_1.Button, { variant: "contained", onClick: function () { return setOpenVentaRegistrada(false); }, sx: {
                                borderRadius: 3,
                                px: 5,
                                py: 1,
                                textTransform: "none",
                                fontWeight: "bold",
                                background: "linear-gradient(90deg,#16a34a,#22c55e)",
                                boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                            }, children: "Continuar" }) })] }), animItem && ((0, jsx_runtime_1.jsx)(material_1.Box, { component: "img", src: animItem.img, sx: {
                    position: "fixed",
                    left: animItem.start.left,
                    top: animItem.start.top,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    pointerEvents: "none",
                    zIndex: 2000,
                    animation: "flyToCart 0.7s ease-in-out forwards",
                    "@keyframes flyToCart": {
                        "0%": {
                            transform: "scale(1)",
                            opacity: 1,
                        },
                        "100%": {
                            transform: "translate(-600px, 500px) scale(0.2)",
                            opacity: 0,
                        },
                    },
                } }))] }));
};
exports.CajeroDashboard = CajeroDashboard;
exports.default = exports.CajeroDashboard;
