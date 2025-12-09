import React from "react";
import AdminUsuarios from "../pages/AdminComponents/Usuarios/AdminUsuarios";
import AdminNegocios from "../pages/AdminComponents/Negocios/AdminNegocios";
//import AdminProductos from "../pages/AdminComponents/Productos/AdminProductos";
import  AdminInventario  from "../pages/AdminComponents/Inventario/AdminInventario";
import  AdminCategorias  from "../pages/AdminComponents/Categorias/AdminCategorias";
import  AdminVentas  from "../pages/AdminComponents/Ventas/AdminVentas";
import  CajeroDashboard  from "../pages/AdminComponents/Ventas/Cajero/CajeroDashboard";

// Mapea componentes según el "codigo" que llega desde la BD
export const componentMap: Record<string, React.FC> = {
  usuarios: AdminUsuarios,
  negocios: AdminNegocios,
 // productos: AdminProductos,
  inventariofisico: AdminInventario,
  ventas:AdminVentas,
  cajero:CajeroDashboard,
  categorias: AdminCategorias,
};
