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
exports.productosPorVenta = exports.facturaPorCaja = exports.liberar_mesa = exports.actualiza_venta = exports.egresoEliminar = exports.egresoActualizar = exports.egresoCrear = exports.egresosListar = exports.apidetallesMesa = exports.apimesas = exports.apibuscar_cliente = exports.finalizar_venta = exports.apiArqueoCaja = exports.apiCerrarCaja = exports.apiAbrirCaja = exports.apiListarProductos = exports.estado_caja = void 0;
var axios_1 = require("./axios");
var estado_caja = function (data) {
    return axios_1.default.post("/cajero/estado-caja", data);
};
exports.estado_caja = estado_caja;
var apiListarProductos = function () {
    return axios_1.default.get("/cajero/productos");
};
exports.apiListarProductos = apiListarProductos;
var apiAbrirCaja = function (data) {
    return axios_1.default.post("/cajero/abrir-caja", data);
};
exports.apiAbrirCaja = apiAbrirCaja;
var apiCerrarCaja = function (data) {
    return axios_1.default.post("/cajero/cerrar-caja", data);
};
exports.apiCerrarCaja = apiCerrarCaja;
var apiArqueoCaja = function (data) {
    return axios_1.default.post("/cajero/arqueo", data);
};
exports.apiArqueoCaja = apiArqueoCaja;
var finalizar_venta = function (payload) {
    return axios_1.default.post("/cajero/finalizar-venta", payload);
};
exports.finalizar_venta = finalizar_venta;
var apibuscar_cliente = function (payload) {
    return axios_1.default.post("/cajero/buscar-cliente", payload);
};
exports.apibuscar_cliente = apibuscar_cliente;
var apimesas = function (payload) {
    return axios_1.default.post("/cajero/mesas", payload);
};
exports.apimesas = apimesas;
var apidetallesMesa = function (payload) {
    return axios_1.default.post("/cajero/detallesMesa", payload);
};
exports.apidetallesMesa = apidetallesMesa;
var egresosListar = function (id_negocio, id_caja) { return __awaiter(void 0, void 0, void 0, function () {
    var data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, axios_1.default.get("/cajero/egresos/".concat(id_negocio, "/").concat(id_caja))];
            case 1:
                data = (_a.sent()).data;
                return [2 /*return*/, data];
        }
    });
}); };
exports.egresosListar = egresosListar;
var egresoCrear = function (payload) {
    return axios_1.default.post("/cajero/egreso", payload);
};
exports.egresoCrear = egresoCrear;
var egresoActualizar = function (id, payload) {
    return axios_1.default.put("/cajero/egreso/".concat(id), payload);
};
exports.egresoActualizar = egresoActualizar;
var egresoEliminar = function (id) {
    return axios_1.default.delete("/cajero/egreso/".concat(id));
};
exports.egresoEliminar = egresoEliminar;
var actualiza_venta = function (payload) {
    return axios_1.default.post("/cajero/actualizar_venta", payload);
};
exports.actualiza_venta = actualiza_venta;
var liberar_mesa = function (id_mesa, id_negocio) {
    return axios_1.default.get("/cajero/liberar_mesa/".concat(id_mesa, "/").concat(id_negocio));
};
exports.liberar_mesa = liberar_mesa;
var facturaPorCaja = function (data) {
    return axios_1.default.post("cajero/factura-por-caja", data);
};
exports.facturaPorCaja = facturaPorCaja;
var productosPorVenta = function (data) {
    return axios_1.default.post("cajero/factura-por-detalle", data);
};
exports.productosPorVenta = productosPorVenta;
