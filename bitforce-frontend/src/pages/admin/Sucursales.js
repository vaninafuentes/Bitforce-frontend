// src/pages/admin/Sucursales.js
import React, { useEffect, useState, useCallback } from "react";
import { Branch as BranchApi } from "../../utils/api";

/* Modal liviano para confirmar borrado */
function SimpleModal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1050 };
  const layer = { position: "fixed", inset: 0, zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" };
  const card = { width: "100%", maxWidth: 560, background: "#0e1526", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, overflow: "hidden", color: "#e5e7eb", boxShadow: "0 15px 50px rgba(0,0,0,.5)" };
  return (
    <>
      <div style={backdrop} onClick={onClose} />
      <div style={layer}>
        <div style={card}>
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
            <h5 className="mb-0">{title}</h5>
            <button className="btn btn-sm btn-outline-light" onClick={onClose}>✕</button>
          </div>
          <div className="px-4 py-3">{children}</div>
          {footer && <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">{footer}</div>}
        </div>
      </div>
    </>
  );
}

export default function SucursalesAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState("");

  // Form crear
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [creating, setCreating] = useState(false);

  // Edición inline
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ nombre: "", direccion: "" });
  const [savingId, setSavingId] = useState(null);

  // Modal borrar
  const [modal, setModal] = useState({ open: false, id: null, texto: "" });

  const ordenar = useCallback(
    (arr) =>
      (arr || []).slice().sort((a, b) => {
        const n = String(a.nombre).localeCompare(String(b.nombre), "es", { sensitivity: "base" });
        if (n !== 0) return n;
        return String(a.direccion).localeCompare(String(b.direccion), "es", { sensitivity: "base" });
      }),
    []
  );

  const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAlerta("");
      const list = await BranchApi.list(); // GET /api/branch/
      setRows(ordenar(list));
    } catch (e) {
      console.error(e);
      setAlerta("No se pudieron cargar las sucursales.");
    } finally {
      setLoading(false);
    }
  }, [ordenar]);

  useEffect(() => {
    load();
  }, [load]);

  /* Crear */
  const onCreate = async () => {
    setAlerta("");

    const nombreTrim = String(nombre || "").trim();
    const dirTrim = String(direccion || "").trim();
    if (!nombreTrim || !dirTrim) {
      setAlerta("Completá nombre y dirección.");
      return;
    }

    // Validación frontal anti-duplicados (case-insensitive y normalizando espacios)
    const yaExiste = rows.some(
      (r) => norm(r.nombre) === norm(nombreTrim) && norm(r.direccion) === norm(dirTrim)
    );
    if (yaExiste) {
      setAlerta("Ya existe una sucursal con ese nombre y dirección.");
      return;
    }

    try {
      setCreating(true);
      const created = await BranchApi.create({ nombre: nombreTrim, direccion: dirTrim }); // POST /api/branch/
      setRows((rs) => ordenar([created, ...rs]));
      setNombre("");
      setDireccion("");
    } catch (e) {
      console.error(e);
      const data = e?.response?.data;
      let msg = "Error al crear la sucursal.";
      if (data?.non_field_errors?.[0]) msg = data.non_field_errors[0];
      else if (data?.detail) msg = data.detail;
      else if (typeof data === "string") msg = data;
      setAlerta(msg);
    } finally {
      setCreating(false);
    }
  };

  /* Editar inline */
  const startEdit = (r) => {
    setEditingId(r.id);
    setDraft({ nombre: r.nombre ?? "", direccion: r.direccion ?? "" });
    setAlerta("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ nombre: "", direccion: "" });
    setSavingId(null);
    setAlerta("");
  };

  const saveEdit = async (r) => {
    setAlerta("");
    const nombreTrim = String(draft.nombre || "").trim();
    const dirTrim = String(draft.direccion || "").trim();
    if (!nombreTrim || !dirTrim) {
      setAlerta("Nombre y dirección no pueden estar vacíos.");
      return;
    }

    // Validación frontal anti-duplicados (excluye la fila actual)
    const yaExiste = rows.some(
      (x) =>
        x.id !== r.id &&
        norm(x.nombre) === norm(nombreTrim) &&
        norm(x.direccion) === norm(dirTrim)
    );
    if (yaExiste) {
      setAlerta("Ya existe una sucursal con ese nombre y dirección.");
      return;
    }

    try {
      setSavingId(r.id);
      const updated = await BranchApi.update(r.id, { nombre: nombreTrim, direccion: dirTrim }); // PATCH /api/branch/:id/
      setRows((rs) => ordenar(rs.map((x) => (x.id === r.id ? updated : x))));
      cancelEdit();
    } catch (e) {
      console.error(e);
      const data = e?.response?.data;
      let msg = "Error al guardar la sucursal.";
      if (data?.non_field_errors?.[0]) msg = data.non_field_errors[0];
      else if (data?.detail) msg = data.detail;
      else if (typeof data === "string") msg = data;
      setAlerta(msg);
      setSavingId(null);
    }
  };

  /* Borrar */
  const askDelete = (r) => {
    setModal({
      open: true,
      id: r.id,
      texto: `¿Eliminar la sucursal "${r.nombre}" — ${r.direccion}?`,
    });
  };

  const confirmDelete = async () => {
    const id = modal.id;
    try {
      await BranchApi.remove(id); // DELETE /api/branch/:id/
      setRows((rs) => rs.filter((x) => x.id !== id));
      setModal({ open: false, id: null, texto: "" });
    } catch (e) {
      console.error(e);
      setModal({ open: false, id: null, texto: "" });
      setAlerta("No se pudo eliminar. Puede estar en uso.");
    }
  };

  if (loading) return <div className="text-muted">Cargando…</div>;

  return (
    <div>
      <h2 className="h3 text-light mb-1">Sucursales</h2>
      <p className="text-muted mb-3">Creá, editá y administrá las sucursales.</p>

      {alerta && (
        <div className="alert alert-danger text-center" role="alert">
          {alerta}
        </div>
      )}

      {/* Form crear */}
      <div
        className="p-4 mb-4 rounded-3 border"
        style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Nombre</label>
            <input
              className="form-control bg-dark text-light"
              placeholder="(p. ej. Centro)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label">Dirección</label>
            <input
              className="form-control bg-dark text-light"
              placeholder="(p. ej. Av. Siempre Viva 742)"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2">
            <button
              className="btn btn-success w-100"
              onClick={onCreate}
              disabled={creating}
              title="Crear sucursal"
            >
              {creating ? "Creando…" : "Crear"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-responsive rounded-3 border" style={{ borderColor: "rgba(255,255,255,.1)" }}>
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr className="text-muted">
              <th style={{ width: 70 }}>ID</th>
              <th>Nombre</th>
              <th>Dirección</th>
              <th className="text-end" style={{ width: 220 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted py-4">
                  No hay sucursales creadas.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const editing = editingId === r.id;
                return (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td style={{ minWidth: 200 }}>
                      {editing ? (
                        <input
                          className="form-control form-control-sm bg-dark text-light"
                          value={draft.nombre}
                          onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                        />
                      ) : (
                        r.nombre
                      )}
                    </td>
                    <td>
                      {editing ? (
                        <input
                          className="form-control form-control-sm bg-dark text-light"
                          value={draft.direccion}
                          onChange={(e) => setDraft((d) => ({ ...d, direccion: e.target.value }))}
                        />
                      ) : (
                        r.direccion
                      )}
                    </td>
                    <td className="text-end">
                      {editing ? (
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => saveEdit(r)}
                            disabled={savingId === r.id}
                          >
                            {savingId === r.id ? "Guardando…" : "Guardar"}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="d-inline-flex gap-2">
                          <button className="btn btn-sm btn-primary" onClick={() => startEdit(r)}>
                            Editar
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => askDelete(r)}>
                            Borrar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal borrar */}
      <SimpleModal
        open={modal.open}
        title="Eliminar sucursal"
        onClose={() => setModal({ open: false, id: null, texto: "" })}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModal({ open: false, id: null, texto: "" })}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={confirmDelete}>
              Eliminar
            </button>
          </>
        }
      >
        <p className="mb-0">{modal.texto}</p>
      </SimpleModal>
    </div>
  );
}
