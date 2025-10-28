// src/routes/RoleRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allow = [], children }) {
  const { user, isAuth, ready } = useAuth();

  // A) Mientras el AuthContext hidrata (tokens → user)
  if (!ready || !user || typeof user.rol === "undefined") {
    return (
      <div className="text-center text-muted py-5">
        Cargando tu sesión…
      </div>
    );
  }

  // B) No autenticado → al login
  if (!isAuth) return <Navigate to="/login" replace />;

  // C) Normalizamos rol y lista permitida
  const rol = String(user.rol || "").toLowerCase();
  const allowed = allow.map((a) => String(a).toLowerCase());

  // Si hay restricción y el rol no está permitido → mandar a su panel
  if (allowed.length > 0 && !allowed.includes(rol)) {
    const target = rol === "admin" ? "/admin/clases" : "/cliente/clases";
    return <Navigate to={target} replace />;
  }

  // D) OK
  return children ?? <Outlet />;
}
