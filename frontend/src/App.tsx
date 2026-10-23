import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/PublicComponents/Home";
import Login from "./pages/AdminComponents/Login";
import AdminDashboard from "./pages/AdminComponents/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import NotFound from "./pages/NotFound";
import Tienda from "./pages/PublicComponents/tienda/Tienda";
import EstadoPedido from "./pages/PublicComponents/tienda/EstadoPedido";
import ProductoPagina from "./pages/PublicComponents/tienda/ProductoPagina";
import PortalTiquetera from "./pages/PublicComponents/tiquetera/PortalTiquetera";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tienda" element={<Tienda />} />
        <Route path="/tienda/p/:slug" element={<ProductoPagina />} />
        <Route path="/tienda/pedido/:codigo/:token" element={<EstadoPedido />} />
        {/* Portal del cliente de tiqueteras: por enlace/QR o buscando con código + documento */}
        <Route path="/tiquetera/:token" element={<PortalTiquetera />} />

        {/* 🔥 RUTA PRINCIPAL ADMIN */}
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* 🔥 RUTA DINÁMICA ADMIN — NECESARIA PARA useParams() */}
        <Route
          path="/admin/:modulo"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Sitio público de cada negocio por su url_negocio (ej. /punto-urbano) */}
        <Route path="/:negocio" element={<Home />} />
        <Route path="/:negocio/tienda" element={<Tienda />} />
        <Route path="/:negocio/tienda/p/:slug" element={<ProductoPagina />} />
        <Route path="/:negocio/tiquetera" element={<PortalTiquetera />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
