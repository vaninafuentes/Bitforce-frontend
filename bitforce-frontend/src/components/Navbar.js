import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-md bf-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <span className="text-success me-2">●</span> BitForce Gym
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-md-center gap-2">
            {!user && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-primary" to="/register">Crear cuenta</NavLink>
                </li>
              </>
            )}
            {!!user && (
              <>
                <li className="nav-item me-2 bf-muted">Hola, {user.name}</li>
                <li className="nav-item">
                  <button className="btn btn-outline-secondary" onClick={logout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
