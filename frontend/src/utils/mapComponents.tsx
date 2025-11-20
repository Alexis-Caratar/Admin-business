import React from "react";
import AdminUsuarios from "../pages/AdminComponents/Usuarios/AdminUsuarios";
import AdminNegocios from "../pages/AdminComponents/Negocios/AdminNegocios";
import AdminProductos from "../pages/AdminComponents/Productos/AdminProductos";
import  AdminInventario  from "../pages/AdminComponents/Inventario/AdminInventario";

// Mapea componentes según el "codigo" que llega desde la BD
export const componentMap: Record<string, React.FC> = {
  usuarios: AdminUsuarios,
  negocios: AdminNegocios,
  productos: AdminProductos,
  inventariofisico: AdminInventario,
};
