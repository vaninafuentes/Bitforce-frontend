// src/App.js
import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Componentes globales
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Layouts protegidos
import AdminAppLayout from "./layouts/AdminAppLayout";
import ClienteAppLayout from "./layouts/ClienteAppLayout";

// Páginas públicas
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

// Páginas Cliente
import ClientClases from "./pages/client/Clases";
import ClientPerfil from "./pages/client/Perfil";
import ClientReservas from "./pages/client/Reservas";
import ClientCreditos from "./pages/client/Creditos";

// Páginas Admin
import AdminClientes from "./pages/admin/Clientes";
import AdminClases from "./pages/admin/Clases";
import AdminActividades from "./pages/admin/Actividades";
import AdminSucursales from "./pages/admin/Sucursales";
import AdminCreditos from "./pages/admin/Creditos";

// Rutas protegidas por rol
import RoleRoute from "./routes/RoleRoute";

export default function App() {
  const location = useLocation();

  // Ocultar footer en panel admin **y** en panel cliente
  const hideFooter =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/cliente");

  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Cliente (login + rol limMerchant) */}
        <Route
          path="/cliente/*"
          element={
            <RoleRoute allow={["limMerchant"]}>
              <ClienteAppLayout />
            </RoleRoute>
          }
        >
          {/* /cliente -> /cliente/clases */}
          <Route index element={<Navigate to="clases" replace />} />
          <Route path="clases" element={<ClientClases />} />
          <Route path="perfil" element={<ClientPerfil />} />
          <Route path="reservas" element={<ClientReservas />} />
          <Route path="creditos" element={<ClientCreditos />} />
        </Route>

        {/* Admin (login + rol admin) */}
        <Route
          path="/admin/*"
          element={
            <RoleRoute allow={["admin"]}>
              <AdminAppLayout />
            </RoleRoute>
          }
        >
          {/* /admin -> /admin/clases */}
          <Route index element={<Navigate to="clases" replace />} />
          <Route path="clases" element={<AdminClases />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="actividades" element={<AdminActividades />} />
          <Route path="sucursales" element={<AdminSucursales />} />
          <Route path="creditos" element={<AdminCreditos />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>

      {/* Footer solo fuera del admin */}
      {!hideFooter && <Footer />}
    </AuthProvider>
  );
}
