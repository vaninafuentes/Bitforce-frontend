// src/pages/client/Clases.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Auth, Branch, Actividades, Clases as ClasesApi, Reservas } from "../../utils/api";

/* ========= Helpers ========= */
const pad = (n) => String(n).padStart(2, "0");

// yyyy-mm-dd en local
const ymdLocal = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const ddmmyyyy = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};

const hhmm = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const weekdayLong = (d) =>
  new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date(d));

// límites del día local [00:00, 23:59:59.999]
const dayBoundsLocal = (yyyy_mm_dd) => {
  const [y, m, d] = yyyy_mm_dd.split("-").map((x) => parseInt(x, 10));
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end   = new Date(y, m - 1, d, 23, 59, 59, 999);
  return [start, end];
};

// cutoff
const beforeCutoff = (slot) => {
  const inicio = new Date(slot.inicio);
  const cutoffMin = slot.cutoff_minutes ?? slot.cutoff ?? 0;
  const limite = new Date(inicio.getTime() - cutoffMin * 60 * 1000);
  return new Date() < limite;
};

// ya empezó (ocultamos si es true)
const isStarted = (slot) => new Date(slot.inicio) <= new Date();

// solape [a,b) y [c,d)
const overlaps = (aStart, aEnd, bStart, bEnd) =>
  new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);

// agrupar por día local
const groupByDate = (rows) => {
  const map = {};
  for (const r of rows) {
    const key = ymdLocal(r.inicio);
    if (!map[key]) map[key] = [];
    map[key].push(r);
  }
  for (const k of Object.keys(map)) {
    map[k].sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  }
  return Object.entries(map).sort(([a], [b]) => new Date(a) - new Date(b));
};

/* ========= Página ========= */
export default function Clases() {
  // filtros
  const [sucursalId, setSucursalId] = useState("");
  const [actividadId, setActividadId] = useState("");
  const [fecha, setFecha] = useState(ymdLocal(new Date()));  // “hoy” local

  // catálogos
  const [sucursales, setSucursales] = useState([]);
  const [actividades, setActividades] = useState([]);

  // datos
  const [me, setMe] = useState(null);
  const [slots, setSlots] = useState([]);
  const [misBookings, setMisBookings] = useState([]);

  // ui
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState(null);

  // slotId -> bookingId mío
  const bookedBySlot = useMemo(() => {
    const map = {};
    for (const b of misBookings) {
      const sid = b.slot ?? b.slot_info?.id;
      if (sid) map[sid] = b.id;
    }
    return map;
  }, [misBookings]);

  // catálogos
  useEffect(() => {
    (async () => {
      try {
        const [yo, brs, acts] = await Promise.all([
          Auth.me(),
          Branch.list(),
          Actividades.list(),
        ]);
        setMe(yo || null);
        setSucursales(brs || []);
        setActividades((acts || []).filter((a) => a.activo !== false));
      } catch (e) {
        console.error(e);
        setAlerta({ type: "danger", msg: "No pude cargar datos iniciales." });
      }
    })();
  }, []);

  // cargar slots + mis reservas con filtro robusto
  const loadSlots = async () => {
    setLoading(true);
    setAlerta(null);
    try {
      const params = { ordering: "inicio", only_future: 1 };
      if (sucursalId) params.sucursal = sucursalId;
      if (actividadId) params.actividad = actividadId;

      const [cls, bookings] = await Promise.all([
        ClasesApi.list(params),
        Reservas.list({ ordering: "-creado" }),
      ]);

      const [dayStart, dayEnd] = dayBoundsLocal(fecha);
      const now = new Date();

      let rows = Array.isArray(cls) ? cls.slice() : [];
      rows = rows.filter((s) => {
        const ini = new Date(s.inicio);
        const inDay = ini >= dayStart && ini <= dayEnd;
        const okSuc = !sucursalId || String(s.sucursal) === String(sucursalId);
        const okAct = !actividadId || String(s.actividad) === String(actividadId);
        const okNoStart = ini > now; // oculta si ya empezó
        return inDay && okSuc && okAct && okNoStart;
      });

      setSlots(rows);

      const mine = (bookings || []).filter(
        (r) => (r.user_info?.id ?? r.user) === (me?.id ?? -1)
      );
      setMisBookings(mine);
    } catch (e) {
      console.error(e);
      setAlerta({ type: "danger", msg: "No se pudieron cargar las clases." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (me) loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, fecha, sucursalId, actividadId]);

  // 🔄 auto-refresh cada 60s para que una clase “desaparezca” al alcanzar su hora de inicio
  useEffect(() => {
    const id = setInterval(loadSlots, 60000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, sucursalId, actividadId]);

  const reservar = async (slot) => {
    try {
      await Reservas.create({ slot: slot.id });
      setAlerta({ type: "success", msg: "¡Reserva creada!" });
      await loadSlots();
      const yo = await Auth.me();
      setMe(yo);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        "No se pudo reservar.";
      setAlerta({ type: "danger", msg });
    }
  };

  const cancelar = async (slot) => {
    const bookingId = bookedBySlot[slot.id];
    if (!bookingId) return;

    if (!beforeCutoff(slot)) {
      setAlerta({ type: "warning", msg: "Ya no se puede cancelar (pasó el cutoff)." });
      return;
    }
    try {
      await Reservas.remove(bookingId);
      setAlerta({ type: "success", msg: "Reserva cancelada." });
      await loadSlots();
      const yo = await Auth.me();
      setMe(yo);
    } catch (e) {
      console.error(e);
      setAlerta({ type: "danger", msg: "No se pudo cancelar la reserva." });
    }
  };

  return (
    <div>
      {/* Header + estado de créditos */}
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
        <div>
          <h2 className="text-light mb-1">Clases disponibles</h2>
          <p className="text-muted mb-0">
            Créditos: <b>{me?.creditos ?? 0}</b>{" "}
            {me?.fecha_vencimiento && (
              <>— vence el <b>{ddmmyyyy(me.fecha_vencimiento)}</b></>
            )}
          </p>
        </div>

        <button className="btn btn-outline-light" onClick={loadSlots}>
          Actualizar
        </button>
      </div>

      {alerta && (
        <div className={`alert alert-${alerta.type || "info"} py-2`}>{alerta.msg}</div>
      )}

      {/* Filtros */}
      <div
        className="p-3 rounded-3 border mb-3"
        style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}
      >
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label">Sede</label>
            <select
              className="form-control bg-dark text-light"
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
            >
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} — {s.direccion}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Actividad</label>
            <select
              className="form-control bg-dark text-light"
              value={actividadId}
              onChange={(e) => setActividadId(e.target.value)}
            >
              <option value="">Todas</option>
              {actividades.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-control bg-dark text-light"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Listado agrupado por día */}
      {loading ? (
        <div className="text-center text-muted py-4">Cargando…</div>
      ) : slots.length === 0 ? (
        <div className="text-center text-muted py-4">
          No hay clases para esos filtros.
        </div>
      ) : (
        groupByDate(slots).map(([dayISO, items]) => (
          <div key={dayISO} className="mb-4">
            <h4 className="text-light fw-bold mb-3">
              {weekdayLong(dayISO).replace(/^\w/, (c) => c.toUpperCase())} {ddmmyyyy(dayISO)}
            </h4>

            <div className="vstack gap-2">
              {items.map((s) => {
                const inicio = new Date(s.inicio);
                const tengoReserva = Boolean(bookedBySlot[s.id]);
                const cutoffOk = beforeCutoff(s);
                const ocupados = s.reservas_count ?? s.ocupados ?? 0;
                const capacidad = s.capacidad ?? s.capacidad_maxima ?? 0;
                const disponibles = Math.max(capacidad - ocupados, 0);

                // Chequeo de solape con MIS reservas futuras
                const tengoSolape = misBookings.some((b) => {
                  const bs = b.slot_info;
                  if (!bs) return false;
                  const futuro = new Date(bs.inicio) > new Date();
                  const aEnd = s.fin ?? new Date(new Date(s.inicio).getTime() + ((s.duracion ?? 60) * 60000));
                  const bEnd = bs.fin ?? new Date(new Date(bs.inicio).getTime() + ((bs.duracion ?? 60) * 60000));
                  return futuro && overlaps(s.inicio, aEnd, bs.inicio, bEnd);
                });

                let motivoDisabled = "";
                if (tengoReserva) motivoDisabled = "Ya reservaste este horario.";
                else if (tengoSolape) motivoDisabled = "Se solapa con otra reserva tuya.";
                else if (!cutoffOk) motivoDisabled = "Cerrado por cutoff.";
                else if ((me?.creditos ?? 0) <= 0) motivoDisabled = "Sin créditos.";
                else if (disponibles <= 0) motivoDisabled = "Sin cupos disponibles.";

                const puedeReservar =
                  !tengoReserva &&
                  !tengoSolape &&
                  cutoffOk &&
                  (me?.creditos ?? 0) > 0 &&
                  disponibles > 0;

                return (
                  <div
                    key={s.id}
                    className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                    style={{ borderColor: "rgba(255,255,255,.08)", background: "#0b1220" }}
                  >
                    <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                      <div className="text-muted text-uppercase small" style={{ minWidth: 90 }}>
                        {weekdayLong(inicio)}
                        <br />
                        <span className="fw-bold">{hhmm(inicio)} hs</span>
                      </div>

                      <div>
                        <div className="fw-semibold">{s.actividad_nombre || "-"}</div>
                        <div className="text-muted small">
                          {s.sucursal_nombre} — {s.sucursal_dir}
                        </div>
                        <div className="small mt-1">
                          <span className="text-success fw-bold">
                            DISPONIBLE ({disponibles})
                          </span>
                          <span className="text-muted ms-2">
                            • Ocupación {ocupados}/{capacidad} • Cutoff{" "}
                            {s.cutoff_minutes ?? s.cutoff ?? "—"} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {tengoReserva ? (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => cancelar(s)}
                          disabled={!cutoffOk}
                          title={cutoffOk ? "Cancelar reserva" : "No se puede cancelar (cutoff)"}
                        >
                          Cancelar
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => reservar(s)}
                          disabled={!puedeReservar}
                          title={puedeReservar ? "Reservar" : motivoDisabled}
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
