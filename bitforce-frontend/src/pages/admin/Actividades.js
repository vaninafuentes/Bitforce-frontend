// src/pages/admin/Actividades.js
import React, { useEffect, useState } from "react";
import { Actividades } from "../../utils/api";

export default function AdminActividades() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState("");

  // Form crear
  const [nombre, setNombre] = useState("");
  const [duracion, setDuracion] = useState("60");
  const [capacidadMax, setCapacidadMax] = useState("12");
  const [cutoff, setCutoff] = useState("10");

  // Edición inline
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    nombre: "",
    duracion: "",
    capacidad_maxima: "",
    cutoff_minutes: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const list = await Actividades.list();
      setRows(
        (list || []).sort((a, b) =>
          String(a.nombre).localeCompare(String(b.nombre), "es", {
            sensitivity: "base",
          })
        )
      );
    } catch (e) {
      console.error(e);
      setAlerta("No pude cargar actividades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- Helpers ---------- */
  const parseOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

  const validateActivity = ({ nombre, duracion, capacidad_maxima, cutoff_minutes }) => {
    if (!String(nombre || "").trim()) {
      return "Ingresá un nombre.";
    }
    const dur = Number(duracion);
    if (!Number.isFinite(dur) || dur < 1) {
      return "La duración debe ser un número mayor o igual a 1.";
    }
    if (capacidad_maxima !== null) {
      const cap = Number(capacidad_maxima);
      if (!Number.isFinite(cap) || cap < 1) {
        return "La capacidad máxima debe ser un número mayor o igual a 1 (o dejá vacío).";
      }
    }
    if (cutoff_minutes !== null) {
      const co = Number(cutoff_minutes);
      if (!Number.isFinite(co) || co < 0) {
        return "El cutoff (min) debe ser un número mayor o igual a 0 (o dejá vacío).";
      }
    }
    return null;
  };

  /* ---------- Crear ---------- */
  const onCreate = async () => {
    try {
      setAlerta("");

      const payload = {
        nombre: String(nombre || "").trim(),
        duracion: Number(duracion),
        capacidad_maxima: parseOrNull(capacidadMax),
        cutoff_minutes: parseOrNull(cutoff),
      };

      const err = validateActivity(payload);
      if (err) {
        setAlerta(err);
        return;
      }

      const created = await Actividades.create(payload);
      setRows((rs) =>
        [created, ...rs].sort((a, b) =>
          String(a.nombre).localeCompare(String(b.nombre), "es", {
            sensitivity: "base",
          })
        )
      );
      // reset
      setNombre("");
      setDuracion("60");
      setCapacidadMax("12");
      setCutoff("10");
    } catch (e) {
      console.error(e);
      setAlerta(
        e?.response?.data?.detail || e?.message || "Error al crear la actividad."
      );
    }
  };

  /* ---------- Editar ---------- */
  const startEdit = (r) => {
    setEditingId(r.id);
    setDraft({
      nombre: r.nombre ?? "",
      duracion: r.duracion ?? 60,
      capacidad_maxima: r.capacidad_maxima ?? "",
      cutoff_minutes: r.cutoff_minutes ?? "",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (r) => {
    try {
      setAlerta("");

      const payload = {
        nombre: String(draft.nombre || "").trim(),
        duracion: Number(draft.duracion),
        capacidad_maxima: parseOrNull(draft.capacidad_maxima),
        cutoff_minutes: parseOrNull(draft.cutoff_minutes),
      };

      const err = validateActivity(payload);
      if (err) {
        setAlerta(err);
        return;
      }

      const updated = await Actividades.update(r.id, payload);
      setRows((rs) => rs.map((x) => (x.id === r.id ? updated : x)));
      setEditingId(null);
    } catch (e) {
      console.error(e);
      setAlerta("Error al guardar la actividad.");
    }
  };

  const remove = async (r) => {
    try {
      await Actividades.remove(r.id);
      setRows((rs) => rs.filter((x) => x.id !== r.id));
    } catch (e) {
      console.error(e);
      setAlerta("No se pudo borrar (puede estar en uso).");
    }
  };

  if (loading) return <div className="text-muted">Cargando…</div>;

  return (
    <div>
      <h2 className="h3 text-light mb-1">Actividades</h2>
      <p className="text-muted mb-3">
        Definí los tipos de clase (duración, cupo y cutoff por defecto).
      </p>

      {alerta && (
        <div className="alert alert-danger text-center" role="alert">
          {alerta}
        </div>
      )}

      {/* Formulario superior */}
      <div
        className="p-4 mb-4 rounded-3 border"
        style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-12 col-lg-4">
            <label className="form-label">Nombre</label>
            <input
              className="form-control bg-dark text-light"
              placeholder="Nombre (p. ej. Funcional)"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label">Duración (min)</label>
            <input
              type="number"
              min={1}
              step={1}
              className="form-control bg-dark text-light"
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label">Capacidad máx.</label>
            <input
              type="number"
              min={1}
              step={1}
              className="form-control bg-dark text-light"
              value={capacidadMax}
              onChange={(e) => setCapacidadMax(e.target.value)}
            />
          </div>

          <div className="col-6 col-lg-2">
            <label className="form-label">Cutoff (min)</label>
            <input
              type="number"
              min={0}
              step={1}
              className="form-control bg-dark text-light"
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value)}
            />
          </div>

          <div className="col-12 col-lg-2">
            <button className="btn btn-success w-100" onClick={onCreate}>
              Crear
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div
        className="table-responsive rounded-3 border"
        style={{ borderColor: "rgba(255,255,255,.1)" }}
      >
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr className="text-muted">
              <th>ID</th>
              <th>Nombre</th>
              <th>Duración</th>
              <th>Capacidad máx.</th>
              <th>Cutoff (min)</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No hay actividades.
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
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, nombre: e.target.value }))
                          }
                        />
                      ) : (
                        r.nombre
                      )}
                    </td>

                    <td style={{ width: 90 }}>
                      {editing ? (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="form-control form-control-sm bg-dark text-light"
                          value={draft.duracion}
                          onChange={(e) =>
                            setDraft((d) => ({ ...d, duracion: e.target.value }))
                          }
                        />
                      ) : (
                        `${r.duracion || 60}'`
                      )}
                    </td>

                    <td style={{ width: 140 }}>
                      {editing ? (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="form-control form-control-sm bg-dark text-light"
                          value={draft.capacidad_maxima}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              capacidad_maxima: e.target.value,
                            }))
                          }
                          placeholder="vacío = sin límite"
                        />
                      ) : (
                        r.capacidad_maxima ?? "—"
                      )}
                    </td>

                    <td style={{ width: 140 }}>
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="form-control form-control-sm bg-dark text-light"
                          value={draft.cutoff_minutes}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              cutoff_minutes: e.target.value,
                            }))
                          }
                          placeholder="vacío = por defecto"
                        />
                      ) : (
                        r.cutoff_minutes ?? "—"
                      )}
                    </td>

                    <td className="text-end" style={{ width: 200 }}>
                      {editing ? (
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => saveEdit(r)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={cancelEdit}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => startEdit(r)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => remove(r)}
                          >
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
    </div>
  );
}
