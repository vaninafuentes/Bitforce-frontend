// src/components/Navbar.jsx
import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();

  const rol = (user?.rol || "").toLowerCase();
  const homePath = isAuth ? (rol === "admin" ? "/admin/clases" : "/cliente/clases") : "/";

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar navbar-dark navbar-expand-lg bg-dark border-bottom border-secondary">
      <div className="container">
        <Link className="navbar-brand fw-bold" to={homePath}>
          BitForce <span style={{ color: "#a78bfa", fontWeight: 800 }}>Gym</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#bfNav">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="bfNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink end to="/" className="nav-link">Inicio</NavLink>
            </li>
          </ul>

          {!isAuth ? (
            <div className="d-flex gap-2">
              <NavLink to="/login" className="btn btn-outline-light">Ingresar</NavLink>
              <NavLink to="/register" className="btn btn-primary">Crear cuenta</NavLink>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary small d-none d-md-inline">
                {rol === "admin" ? "Admin" : "Cliente"}
              </span>

              <div className="dropdown">
                <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  {user?.username || "Usuario"}
                </button>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-dark">
                  <li>
                    <Link className="dropdown-item" to={homePath}>Ir al panel</Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to={rol === "admin" ? "/admin/clases" : "/cliente/perfil"}>
                      Mi perfil
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={doLogout}>Salir</button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
