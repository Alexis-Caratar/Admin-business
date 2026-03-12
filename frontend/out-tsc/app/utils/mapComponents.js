"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.componentMap = void 0;
var AdminUsuarios_1 = require("../pages/AdminComponents/Usuarios/AdminUsuarios");
var AdminNegocios_1 = require("../pages/AdminComponents/Negocios/AdminNegocios");
//import AdminProductos from "../pages/AdminComponents/Productos/AdminProductos";
var AdminInventario_1 = require("../pages/AdminComponents/Inventario/AdminInventario");
var AdminCategorias_1 = require("../pages/AdminComponents/Categorias/AdminCategorias");
var AdminVentas_1 = require("../pages/AdminComponents/Ventas/AdminVentas");
var CajeroDashboard_1 = require("../pages/AdminComponents/Ventas/Cajero/CajeroDashboard");
// Mapea componentes según el "codigo" que llega desde la BD
exports.componentMap = {
    usuarios: AdminUsuarios_1.default,
    negocios: AdminNegocios_1.default,
    // productos: AdminProductos,
    inventariofisico: AdminInventario_1.default,
    ventas: AdminVentas_1.default,
    cajero: CajeroDashboard_1.default,
    categorias: AdminCategorias_1.default,
};
