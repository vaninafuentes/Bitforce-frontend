// src/pages/public/Register.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Auth } from "../../utils/api";
import "./Login.css";

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [serverError, setServerError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setServerError(null);
    setOkMsg(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setOkMsg(null);
    setLoading(true);
    try {
      await Auth.publicRegister(form);
      setOkMsg("¡Registro enviado! Cuando un administrador active tu cuenta, vas a poder iniciar sesión.");
      setForm({ username: "", email: "", password: "" });
    } catch (err) {
      const data = err?.response?.data;
      let msg = "No se pudo registrar";
      if (typeof data === "string") msg = data;
      else if (data?.detail) msg = data.detail;
      else if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        if (firstKey) msg = `${firstKey}: ${Array.isArray(data[firstKey]) ? data[firstKey].join(", ") : data[firstKey]}`;
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container login-container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="bf-card login-card p-4 p-md-5">
            <h2 className="fw-bold mb-1">Crear cuenta</h2>
            <p className="text-muted-2 mb-4">Registrate para empezar</p>

            {serverError && <div className="alert alert-danger py-2">{serverError}</div>}
            {okMsg && <div className="alert alert-success py-2">{okMsg}</div>}

            <form onSubmit={onSubmit} className="vstack gap-3">
              <div>
                <label className="form-label">Usuario</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  className="form-control"
                  placeholder="tu_usuario"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  className="form-control"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="form-label">Contraseña</label>
                <div className="input-group">
                  <input
                    type={show ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="form-control"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => setShow(s => !s)}
                  >
                    {show ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-bf w-100 mt-2" disabled={loading}>
                {loading ? 'Enviando…' : 'Registrarme'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <small className="text-muted-2">
                ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
