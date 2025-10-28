// src/layouts/ClienteAppLayout.jsx
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ClienteAppLayout() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  const rol = String(user.rol || "").toLowerCase();
  if (rol !== "limmerchant") return <Navigate to="/" replace />;

  return (
    <div className="container py-3">
      {/* Subnav del cliente */}
      <div className="mb-3">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <NavLink to="/cliente/clases" className="nav-link">
              Clases
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/cliente/reservas" className="nav-link">
              Reservas
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/cliente/creditos" className="nav-link">
              Créditos
            </NavLink>
          </li>
        </ul>
      </div>

      <Outlet />
    </div>
  );
}
