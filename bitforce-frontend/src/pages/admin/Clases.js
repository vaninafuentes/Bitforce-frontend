// src/pages/admin/Clases.js
import React, { useEffect, useMemo, useState } from "react";
import { Actividades, Branch, Clases as ClasesApi, Reservas } from "../../utils/api";

/* ---------------- Modal liviano ---------------- */
function SimpleModal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  const backdrop = { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1050 };
  const box = { position: "fixed", inset: 0, zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" };
  const card = { width: "100%", maxWidth: 600, background: "#0e1526", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, boxShadow: "0 15px 50px rgba(0,0,0,.5)", color: "#e5e7eb" };
  return (
    <>
      <div style={backdrop} onClick={onClose} />
      <div style={box}>
        <div style={card}>
          <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-white-10">
            <h5 className="mb-0">{title}</h5>
            <button className="btn btn-sm btn-outline-light" onClick={onClose}>✕</button>
          </div>
          <div className="px-4 py-3">{children}</div>
          {footer && <div className="px-4 py-3 border-top border-white-10 d-flex justify-content-end gap-2">{footer}</div>}
        </div>
      </div>
    </>
  );
}

/* ---------------- Helpers ---------------- */
const pad = (n) => String(n).padStart(2, "0");
const fmtFechaHora = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "—" : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const isPast = (slot) => {
  const fin = slot.fin ? new Date(slot.fin) : new Date(new Date(slot.inicio).getTime() + ((slot.duracion ?? 60) * 60000));
  return fin <= new Date();
};

export default function AdminClases() {
  const [actividades, setActividades] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [actividadId, setActividadId] = useState("");
  const [sucursalId, setSucursalId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [cutoff, setCutoff] = useState("");

  const [alerta, setAlerta] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ fecha: "", hora: "", capacidad: "", cutoff: "" });
  const [modal, setModal] = useState({ open: false, title: "", body: null, footer: null });

  /* -------- Carga inicial -------- */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [acts, brs, cls] = await Promise.all([
          Actividades.list(),
          Branch.list(),
          ClasesApi.list({ ordering: "-inicio" }),
        ]);
        setActividades(acts || []);
        setSucursales(brs || []);
        const futureOnly = (cls || []).filter((c) => !isPast(c));
        setRows(futureOnly.sort((a, b) => new Date(a.inicio) - new Date(b.inicio)));
      } catch (e) {
        console.error(e);
        setAlerta("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // sugerir defaults
  useEffect(() => {
    if (!actividadId) return;
    const act = actividades.find((a) => String(a.id) === String(actividadId));
    if (!act) return;
    if (capacidad === "" && act.capacidad_maxima != null) setCapacidad(String(act.capacidad_maxima));
    if (cutoff === "" && act.cutoff_minutes != null) setCutoff(String(act.cutoff_minutes));
  }, [actividadId, actividades, capacidad, cutoff]);

  const actOpts = useMemo(() => actividades.map((a) => ({ value: a.id, label: `${a.nombre} — ${a.duracion || 60} min` })), [actividades]);
  const sucOpts = useMemo(() => sucursales.map((s) => ({ value: s.id, label: s.nombre })), [sucursales]);

  /* -------- Crear -------- */
  const onCreate = async () => {
    setAlerta("");
    try {
      if (!actividadId || !sucursalId || !fecha || !hora) {
        setAlerta("⚠️ Completá Actividad, Sucursal, Fecha y Hora.");
        return;
      }
      const inicio = new Date(`${fecha}T${hora}:00`);
      if (inicio <= new Date()) return setAlerta("❌ No podés programar clases en el pasado.");
      const payload = {
        actividad: Number(actividadId),
        sucursal: Number(sucursalId),
        inicio: `${fecha}T${hora}:00`,
        ...(capacidad && { capacidad: Number(capacidad) }),
        ...(cutoff && { cutoff_minutes: Number(cutoff) }),
      };
      const created = await ClasesApi.create(payload);
      if (!isPast(created))
        setRows((rs) => [...rs, created].sort((a, b) => new Date(a.inicio) - new Date(b.inicio)));
      setFecha(""); setHora("");
    } catch (e) {
      console.error(e);
      setAlerta(e?.response?.data?.detail || "Error al crear la clase.");
    }
  };

  /* -------- Edición -------- */
  const startEdit = (r) => {
    const d = new Date(r.inicio);
    setEditingId(r.id);
    setEditDraft({
      fecha: d.toISOString().split("T")[0],
      hora: d.toISOString().split("T")[1].slice(0, 5),
      capacidad: r.capacidad ?? "",
      cutoff: r.cutoff_minutes ?? "",
    });
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (r) => {
    try {
      const payload = {
        actividad: r.actividad?.id ?? r.actividad,
        sucursal: r.sucursal?.id ?? r.sucursal,
        inicio: `${editDraft.fecha}T${editDraft.hora}:00`,
        ...(editDraft.capacidad && { capacidad: Number(editDraft.capacidad) }),
        ...(editDraft.cutoff && { cutoff_minutes: Number(editDraft.cutoff) }),
      };
      const updated = await ClasesApi.update(r.id, payload);
      setRows((rs) =>
        rs
          .map((x) => (x.id === r.id ? updated : x))
          .filter((x) => !isPast(x))
          .sort((a, b) => new Date(a.inicio) - new Date(b.inicio))
      );
      setEditingId(null);
    } catch {
      setAlerta("Error al guardar cambios.");
    }
  };

  /* -------- Borrar / Ver reservas -------- */
  const askDelete = (r) =>
    setModal({
      open: true,
      title: "Eliminar clase",
      body: <p className="mb-0">¿Eliminar la clase <b>#{r.id}</b> del <b>{fmtFechaHora(r.inicio)}</b>?</p>,
      footer: (
        <>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false })}>Cancelar</button>
          <button className="btn btn-danger" onClick={async () => {
            try {
              await ClasesApi.remove(r.id);
              setRows((rs) => rs.filter((x) => x.id !== r.id));
              setModal({ open: false });
            } catch {
              setModal({
                open: true,
                title: "Eliminar clase",
                body: <p className="text-danger mb-0">No se puede eliminar (tiene reservas).</p>,
                footer: <button className="btn btn-primary" onClick={() => setModal({ open: false })}>Cerrar</button>,
              });
            }
          }}>Eliminar</button>
        </>
      ),
    });

  const openReservas = async (r) => {
    try {
      const data = await Reservas.list({ clase_id: r.id });
      setModal({
        open: true,
        title: `Reservas — Clase #${r.id}`,
        body: (data || []).length === 0
          ? <p className="mb-0 text-muted">Sin reservas.</p>
          : (
            <table className="table table-sm table-borderless text-light align-middle mb-0">
              <thead className="border-bottom"><tr className="text-muted"><th>ID</th><th>Cliente</th><th>Creado</th></tr></thead>
              <tbody>{data.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.user_username || d.user_info?.username || d.user || "-"}</td>
                  <td>{fmtFechaHora(d.creado)}</td>
                </tr>
              ))}</tbody>
            </table>
          ),
        footer: <button className="btn btn-primary" onClick={() => setModal({ open: false })}>Cerrar</button>,
      });
    } catch { setAlerta("Error al cargar reservas."); }
  };

  /* -------- Render -------- */
  if (loading) return <div className="text-muted">Cargando…</div>;

  return (
    <div>
      <h2 className="h3 text-light mb-1">Clases programadas</h2>
      <p className="text-muted mb-4">Creá, editá y controlá las clases (las pasadas no se muestran).</p>
      {alerta && <div className="alert alert-danger text-center" role="alert">{alerta}</div>}

      {/* Formulario */}
      <div className="p-4 mb-4 rounded-3 border" style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}>
        <div className="row g-3 align-items-end">
          <div className="col-lg">
            <label className="form-label">Actividad</label>
            <select className="form-select bg-dark text-light" value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {actOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="col-lg">
            <label className="form-label">Sucursal</label>
            <select className="form-select bg-dark text-light" value={sucursalId} onChange={(e) => setSucursalId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {sucOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="col-auto"><label className="form-label">Fecha</label><input type="date" className="form-control bg-dark text-light" min={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} /></div>
          <div className="col-auto"><label className="form-label">Hora</label><input type="time" className="form-control bg-dark text-light" value={hora} onChange={(e) => setHora(e.target.value)} /></div>
          <div className="col-auto"><label className="form-label">Cupos</label><input className="form-control bg-dark text-light" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} /></div>
          <div className="col-auto"><label className="form-label">Cutoff (min)</label><input className="form-control bg-dark text-light" value={cutoff} onChange={(e) => setCutoff(e.target.value)} /></div>
          <div className="col-auto"><button className="btn btn-success" onClick={onCreate}>Crear</button></div>
        </div>
      </div>

      {/* Tabla */}
      <div className="table-responsive rounded-3 border" style={{ borderColor: "rgba(255,255,255,.1)" }}>
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr className="text-muted">
              <th>ID</th><th>Inicio</th><th>Actividad</th><th>Sucursal</th><th>Ocupación</th><th>Cutoff</th><th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted py-4">No hay clases futuras.</td></tr>
            ) : rows.map((r) => {
              const editing = editingId === r.id;
              return (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    {editing ? (
                      <div className="d-flex gap-2">
                        <input type="date" className="form-control form-control-sm bg-dark text-light" value={editDraft.fecha} onChange={(e) => setEditDraft((d) => ({ ...d, fecha: e.target.value }))} />
                        <input type="time" className="form-control form-control-sm bg-dark text-light" value={editDraft.hora} onChange={(e) => setEditDraft((d) => ({ ...d, hora: e.target.value }))} />
                      </div>
                    ) : fmtFechaHora(r.inicio)}
                  </td>
                  <td>{r.actividad?.nombre || r.actividad_nombre || "-"}</td>
                  <td>{r.sucursal?.nombre || r.sucursal_nombre || "-"}</td>
                  <td>{(r.reservas_count ?? r.ocupados ?? 0) + "/" + (r.capacidad ?? "?")}</td>
                  <td>{editing
                    ? <input type="number" className="form-control form-control-sm bg-dark text-light" value={editDraft.cutoff} onChange={(e) => setEditDraft((d) => ({ ...d, cutoff: e.target.value }))} style={{ width: 80 }} />
                    : (r.cutoff_minutes ?? "—")}
                  </td>
                  <td className="text-end">
                    {editing ? (
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-sm btn-success" onClick={() => saveEdit(r)}>Guardar</button>
                        <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="d-inline-flex gap-2">
                        <button className="btn btn-sm btn-primary" onClick={() => startEdit(r)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => askDelete(r)}>Borrar</button>
                        <button className="btn btn-sm btn-outline-light" onClick={() => openReservas(r)}>Ver reservados</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SimpleModal open={modal.open} title={modal.title} onClose={() => setModal({ open: false })} footer={modal.footer}>
        {modal.body}
      </SimpleModal>
    </div>
  );
}
