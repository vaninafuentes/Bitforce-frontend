// src/pages/admin/Clientes.js
import React, { useEffect, useMemo, useState } from "react";
import { Users } from "../../utils/api";

export default function AdminClientes() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // búsqueda y filtros
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all"); // all | active | inactive

  // modal: confirmar borrado
  const [showConfirm, setShowConfirm] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const list = await Users.list();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr("No pude cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((u) => {
      const okText =
        !needle ||
        (u.username || "").toLowerCase().includes(needle) ||
        (u.email || "").toLowerCase().includes(needle);

      const okStatus =
        status === "all" ||
        (status === "active" && !!u.is_active) ||
        (status === "inactive" && !u.is_active);

      return okText && okStatus;
    });
  }, [rows, q, status]);

  const onToggle = async (u) => {
    try {
      await Users.toggleActive(u.id, !u.is_active);
      load();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado");
    }
  };

  // --- Borrar ---
  const askDelete = (id) => {
    setToDeleteId(id);
    setShowConfirm(true);
    document.body.style.overflow = "hidden";
  };

  const closeConfirm = () => {
    setShowConfirm(false);
    setToDeleteId(null);
    document.body.style.overflow = "";
  };

  const confirmDelete = async () => {
    if (!toDeleteId) return;
    try {
      await Users.remove(toDeleteId);
      closeConfirm();
      load();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "No se pudo eliminar";
      alert(msg);
      closeConfirm();
    }
  };

  if (loading) return <div className="text-secondary">Cargando…</div>;
  if (err) return <div className="alert alert-danger">{err}</div>;

  return (
    <div>
      <h2 className="text-light mb-3">Clientes</h2>

      {/* Toolbar de búsqueda y filtros */}
      <div className="adm-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por usuario o email…"
          />
        </div>

        <div className="filter-wrap">
          <button
            className={`pill ${status === "all" ? "active" : ""}`}
            onClick={() => setStatus("all")}
          >
            Todos
          </button>
          <button
            className={`pill ${status === "active" ? "active" : ""}`}
            onClick={() => setStatus("active")}
          >
            Activos
          </button>
          <button
            className={`pill ${status === "inactive" ? "active" : ""}`}
            onClick={() => setStatus("inactive")}
          >
            Inactivos
          </button>
        </div>
      </div>

      <table className="adm-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email || "-"}</td>
              <td>{u.rol || "-"}</td>
              <td>
                <button
                  className={`badge ${u.is_active ? "bg-success" : "bg-secondary"}`}
                  onClick={() => onToggle(u)}
                  title={u.is_active ? "Desactivar" : "Activar"}
                >
                  {u.is_active ? "Sí" : "No"}
                </button>
              </td>
              <td className="actions">
                <button className="danger" onClick={() => askDelete(u.id)}>
                  Borrar
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="6" className="text-secondary">
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== Modal Confirmación Borrado ===== */}
      {showConfirm && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1300 }}
            onClick={closeConfirm}
          />
          <div className="modal d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1310 }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content bg-dark text-light border-secondary">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar eliminación</h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeConfirm}
                  />
                </div>
                <div className="modal-body">
                  <p>¿Eliminar usuario?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-light" onClick={closeConfirm}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-danger" onClick={confirmDelete}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .adm-toolbar{
          display:flex; gap:12px; align-items:center; margin:12px 0 16px;
          flex-wrap:wrap;
        }
        .search-wrap{
          position:relative;
          display:flex; align-items:center;
        }
        .search-wrap input{
          background:#121827; border:1px solid rgba(255,255,255,.08);
          color:#e6edf3; border-radius:12px; padding:10px 12px 10px 36px; min-width:260px;
        }
        .search-wrap .search-icon{
          position:absolute; left:10px; opacity:.7; font-size:14px;
        }
        .filter-wrap{ display:flex; gap:8px; }
        .pill{
          background:#0f172a; color:#cbd5e1; border:1px solid rgba(255,255,255,.08);
          padding:8px 12px; border-radius:999px; font-weight:600;
        }
        .pill.active{ background:#4f46e5; color:#fff; border-color:#4f46e5; }

        .adm-table{ width:100%; border-collapse:collapse; }
        .adm-table th, .adm-table td { padding:10px 12px; border-bottom:1px solid rgba(255,255,255,.08); }
        .actions button{ margin-right:8px; background:#ef4444; color:#fff; border:none; border-radius:10px; padding:6px 10px; font-weight:700; }
      `}</style>
    </div>
  );
}
