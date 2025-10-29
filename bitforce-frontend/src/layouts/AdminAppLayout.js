// src/layouts/AdminAppLayout.js
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminAppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="container-fluid py-3">
      <div className="row">
        {/* Sidebar */}
        <aside className="col-12 col-md-3 col-lg-2 mb-3 mb-md-0">
          <div className="card bg-dark text-light border-secondary sticky-top" style={{ top: 80, zIndex: 900 }}>
            <div className="card-body p-0">
              <div className="p-3 border-bottom border-secondary">
                <div className="fw-bold">Panel admin</div>
                <small className="text-secondary">
                  {user?.username} {user?.rol ? `• ${user.rol}` : ""}
                </small>
              </div>

              <nav className="list-group list-group-flush">
                <NavLink to="/admin/clases" className="list-group-item list-group-item-action bg-dark text-light border-secondary">
                  Clases
                </NavLink>
                <NavLink to="/admin/actividades" className="list-group-item list-group-item-action bg-dark text-light border-secondary">
                  Actividades
                </NavLink>
                <NavLink to="/admin/sucursales" className="list-group-item list-group-item-action bg-dark text-light border-secondary">
                  Sucursales
                </NavLink>
                <NavLink to="/admin/clientes" className="list-group-item list-group-item-action bg-dark text-light border-secondary">
                  Clientes
                </NavLink>
                <NavLink to="/admin/creditos" className="list-group-item list-group-item-action bg-dark text-light border-secondary">
                  Créditos
                </NavLink>
              </nav>

              <div className="p-3 border-top border-secondary">
                <button className="btn btn-outline-light w-100" onClick={doLogout}>
                  Salir
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Contenido */}
        <main className="col-12 col-md-9 col-lg-10">
          <div className="card bg-dark text-light border-secondary">
            <div className="card-body">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
