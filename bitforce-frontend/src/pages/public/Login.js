// src/pages/Login.js
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form);
      nav("/");
    } catch (err) {
      setError(err.message || "Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="h4 mb-3">Iniciar sesión</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Usuario</label>
                  <input
                    className="form-control"
                    name="username"
                    value={form.username}
                    onChange={onChange}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      type={showPw ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPw ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary w-100" type="submit">
                  Ingresar
                </button>
              </form>

              <p className="mt-3 mb-0">
                ¿No tenés cuenta? <Link to="/register">Registrate</Link>
              </p>

              <div className="text-muted small mt-3">
                Usuarios de prueba: <code>admin/admin123</code> – <code>cliente/cliente123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
