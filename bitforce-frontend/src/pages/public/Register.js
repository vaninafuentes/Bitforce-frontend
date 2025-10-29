import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Auth } from "../../utils/api";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.username || !form.email || !form.password) {
      setMsg({ type: "danger", text: "Completá usuario, email y contraseña." });
      return;
    }
    try {
      setLoading(true);
      await Auth.publicRegister({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setMsg({
        type: "success",
        text: "Cuenta creada. Un admin debe activarte antes de iniciar sesión.",
      });
      setTimeout(() => nav("/login"), 1200);
    } catch (e) {
      const data = e?.response?.data || {};
      const firstError =
        data?.detail ||
        data?.non_field_errors?.[0] ||
        data?.email?.[0] ||
        data?.username?.[0] ||
        data?.password?.[0] ||
        "No se pudo crear la cuenta.";
      setMsg({ type: "danger", text: firstError });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="row">
        <div className="col-md-6 col-lg-5">
          <div className="login-card p-4">
            <h1 className="h3 fw-semibold mb-2">Crear cuenta</h1>
            <p className="text-muted mb-4">
              Registrate para comenzar a usar Bitforce.

              
            </p>

            {msg && (
              <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>
            )}

            <form onSubmit={submit} className="vstack gap-3">
              {/* Usuario */}
              <div>
                <label className="form-label fw-semibold">Usuario</label>
                <input
                  className="form-control bg-dark text-light"
                  placeholder="tu_usuario"
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  autoComplete="username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="form-label fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control bg-dark text-light"
                  placeholder="tu_email@gmail.com"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  autoComplete="email"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="form-label fw-semibold">Contraseña</label>
                <div className="input-group">
                  <input
                    className="form-control bg-dark text-light"
                    type={showPass ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => setShowPass((s) => !s)}
                    tabIndex={-1}
                  >
                    {showPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {/* Botón idéntico al login */}
              <button
                type="submit"
                className="btn w-100 fw-semibold text-light"
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                  border: "none",
                  padding: "0.75rem",
                  boxShadow: "0 0 12px rgba(124,58,237,0.4)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 18px rgba(124,58,237,0.7)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 12px rgba(124,58,237,0.4)")
                }
              >
                {loading ? "Creando…" : "Registrarme"}
              </button>
            </form>

            <div className="text-center mt-3">
              <small className="text-muted">
                ¿Ya tenés cuenta?{" "}
                <Link to="/login" className="text-decoration-none">
                  Ingresá
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
