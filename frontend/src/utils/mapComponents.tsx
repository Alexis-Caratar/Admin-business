import React from "react";
import AdminNegocios from "../pages/AdminComponents/Negocios/AdminNegocios";
//import AdminProductos from "../pages/AdminComponents/Productos/AdminProductos";
import  AdminInventario  from "../pages/AdminComponents/Inventario/AdminInventario";
import  AdminCategorias  from "../pages/AdminComponents/Categorias/AdminCategorias";
import  AdminVentas  from "../pages/AdminComponents/Ventas/Admin/AdminVentas";
import  CajeroDashboard  from "../pages/AdminComponents/Ventas/Cajero/CajeroDashboard";
import AdminCompras from "../pages/AdminComponents/Compras/AdminCompras";
import HomeAdmin from "../pages/AdminComponents/HomeAdmin";
import AdminPedidos from "../pages/AdminComponents/Pedidos/AdminPedidos";
import AdminFinanzas from "../pages/AdminComponents/Finanzas/AdminFinanzas";
import MeseroPanel from "../pages/AdminComponents/Meseros/MeseroPanel";
import AdminMesas from "../pages/AdminComponents/Mesas/AdminMesas";
import Configuracion from "../pages/AdminComponents/Permisos/Configuracion";
import AdminPublicidad from "../pages/AdminComponents/Publicidad/AdminPublicidad";

// Mapea componentes según el "codigo" que llega desde la BD
export const componentMap: Record<string, React.FC> = {
  // Configuración: Mi negocio, Página web, Usuarios, Permisos y Tiqueteras en un solo lugar
  usuarios: Configuracion,
  negocios: AdminNegocios,
  home: HomeAdmin,
 // productos: AdminProductos,
  compras:AdminCompras,
  inventario: AdminInventario,
  ventas:AdminVentas,
  cajero:CajeroDashboard,
  categorias: AdminCategorias,
  pedidos: AdminPedidos,
  finanzas: AdminFinanzas,
  meseros: MeseroPanel,
  mesas: AdminMesas,
  permisos: Configuracion,
  negocio: Configuracion,
  publicidad: AdminPublicidad,
};
