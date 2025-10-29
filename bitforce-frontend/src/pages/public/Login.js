// src/pages/public/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

export default function Login() {
  const { login, isAuth, user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', password: '' });
  const [show, setShow] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si ya estoy logueado, doy atajos para evitar confusiones
  if (isAuth) {
    const homeByRole = user?.rol === 'admin' ? '/admin/clases' : '/cliente/clases';
    return (
      <div className="container login-container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="bf-card login-card p-4 p-md-5">
              <h2 className="fw-bold mb-2">Ya iniciaste sesión</h2>
              <p className="text-muted-2 mb-4">
                Estás logueado como <strong>{user?.username}</strong>.
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-bf flex-grow-1"
                  onClick={() => navigate(homeByRole, { replace: true })}
                >
                  Ir a mi panel
                </button>
                <button
                  className="btn btn-outline-light flex-grow-1"
                  onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (serverError) setServerError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setLoading(true);
    try {
      const res = await login(form); // usa AuthContext.login
      if (res?.ok) {
        const rol = res?.user?.rol;
        if (rol === 'admin') {
          navigate('/admin/clases', { replace: true });
        } else if (rol === 'limMerchant') {
          navigate('/cliente/clases', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // Mapeo de errores comunes en español
        const raw = res?.error || '';
        let msg = 'Usuario o contraseña incorrectos';
        if (/no active account/i.test(raw)) {
          msg = 'Tu cuenta está inactiva. Un administrador debe activarla.';
        } else if (typeof raw === 'string' && raw.trim()) {
          msg = raw;
        }
        setServerError(msg);
      }
    } catch (err) {
      // Fallback por si algo raro pasa fuera del AuthContext
      const status = err?.response?.status;
      const data = err?.response?.data;
      let msg = 'Usuario o contraseña incorrectos';
      const detail = data?.detail || data?.error;

      if (status === 401 && detail && /no active account/i.test(detail)) {
        msg = 'Tu cuenta está inactiva. Un administrador debe activarla.';
      } else if (!err?.response) {
        msg = 'No se puede conectar al backend (verificar URL/CORS).';
      } else if (typeof data === 'string') {
        msg = data;
      } else if (detail) {
        msg = detail;
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
            <h2 className="fw-bold mb-1">Ingresar</h2>
            <p className="text-muted-2 mb-4">Bienvenido — iniciá sesión para continuar</p>

            {serverError && <div className="alert alert-danger py-2">{serverError}</div>}

            <form onSubmit={onSubmit} className="vstack gap-3">
              <div>
                <label className="form-label">Usuario</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  className="form-control"
                  placeholder="tu_usuario"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="position-relative">
                <label className="form-label">Contraseña</label>
                <div className="position-relative">
                  <input
                    type={show ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    className="form-control pe-5"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  {/* Botón ojo bien alineado dentro del input */}
                  <button
                    type="button"
                    className="btn btn-outline-light position-absolute top-50 end-0 translate-middle-y me-2"
                    style={{ height: 36, lineHeight: '20px', padding: '6px 10px' }}
                    onClick={() => setShow((s) => !s)}
                  >
                    {show ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-bf w-100 mt-2" disabled={loading}>
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <small className="text-muted-2">
                ¿No tenés cuenta? <Link to="/register">Crear</Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
