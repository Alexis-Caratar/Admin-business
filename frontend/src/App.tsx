import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/PublicComponents/Home";
import Login from "./pages/AdminComponents/Login";
import AdminDashboard from "./pages/AdminComponents/AdminDashboard";
import PrivateRoute from "./components/PrivateRoute";
import NotFound from "./pages/NotFound";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
