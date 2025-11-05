import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Auth, Reservas } from "../../utils/api";

const pad = (n) => String(n).padStart(2, "0");
const ddmmyyyy = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};
const hhmm = (d) => {
  const dt = new Date(d);
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const beforeCutoff = (slot) => {
  const inicio = new Date(slot.inicio);
  const cutoffMin = slot.cutoff ?? 0;
  const limite = new Date(inicio.getTime() - cutoffMin * 60 * 1000);
  return new Date() < limite;
};

export default function MisReservas() {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const yo = await Auth.me();
      setMe(yo);
      const all = await Reservas.list({ ordering: "-creado" });
      const mias = (all || []).filter(
        (b) => (b.user_info?.id ?? b.user) === yo.id
      );
      setItems(mias);
    } catch (e) {
      console.error(e);
      setAlerta({ type: "danger", text: "No pude cargar tus reservas." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const { futuras, pasadas } = useMemo(() => {
    const ahora = new Date();

    const fut = [];
    const past = [];

    for (const r of items) {
      const start = new Date(r.slot_info?.inicio);
      (start >= ahora ? fut : past).push(r);
    }

    fut.sort(
      (a, b) =>
        new Date(a.slot_info.inicio) - new Date(b.slot_info.inicio)
    );
    past.sort(
      (a, b) =>
        new Date(b.slot_info.inicio) - new Date(a.slot_info.inicio)
    );

    return { futuras: fut, pasadas: past };
  }, [items]);

  const cancelar = async (r) => {
    const slot = {
      inicio: r.slot_info?.inicio,
      cutoff: r.slot_info?.cutoff,
    };
    if (!beforeCutoff(slot)) {
      setAlerta({ type: "warning", text: "Ya no se puede cancelar (cutoff)." });
      return;
    }
    try {
      await Reservas.remove(r.id);
      setItems((arr) => arr.filter((x) => x.id !== r.id));
      setAlerta({ type: "success", text: "Reserva cancelada." });

      const yo = await Auth.me();
      setMe(yo);
    } catch (e) {
      console.error(e);
      setAlerta({ type: "danger", text: "No se pudo cancelar." });
    }
  };

  return (
    <div>
      <div className="d-flex align-items-end justify-content-between mb-3">
        <div>
          <h2 className="text-light mb-1">Mis reservas</h2>
          <p className="text-muted small mb-0">
            Usuario: <b>{me?.username || "—"}</b>
          </p>
        </div>

        <button className="btn btn-outline-light" onClick={cargar}>
          Actualizar
        </button>
      </div>

      {alerta && (
        <div className={`alert alert-${alerta.type} py-2`}>{alerta.text}</div>
      )}

      {loading ? (
        <div className="text-center text-muted py-4">Cargando…</div>
      ) : (
        <>
          {/* Futuras */}
          <h5 className="text-muted mt-2 mb-2">Próximas</h5>
          <div className="vstack gap-2 mb-4">
            {futuras.length === 0 ? (
              <div className="text-muted">No tenés reservas próximas.</div>
            ) : (
              futuras.map((r) => {
                const s = r.slot_info;
                const fecha = ddmmyyyy(s.inicio);
                const hora = hhmm(s.inicio);
                const cancelable = beforeCutoff({
                  inicio: s.inicio,
                  cutoff: s.cutoff,
                });
                return (
                  <div
                    key={r.id}
                    className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                    style={{
                      borderColor: "rgba(255,255,255,.08)",
                      background: "#0b1220",
                    }}
                  >
                    <div>
                      <div className="fw-semibold">{s.actividad}</div>
                      <div className="text-muted small">
                        {s.sucursal} — {fecha} {hora} hs
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={!cancelable}
                      onClick={() => cancelar(r)}
                      title={
                        cancelable
                          ? "Cancelar"
                          : "No se puede cancelar (cutoff)"
                      }
                    >
                      Cancelar
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Pasadas */}
          <h5 className="text-muted mt-2 mb-2">Historial</h5>
          <div className="vstack gap-2">
            {pasadas.length === 0 ? (
              <div className="text-muted">Todavía no tenés historial.</div>
            ) : (
              pasadas.map((r) => {
                const s = r.slot_info;
                const fecha = ddmmyyyy(s.inicio);
                const hora = hhmm(s.inicio);
                return (
                  <div
                    key={r.id}
                    className="p-3 rounded-3 border"
                    style={{
                      borderColor: "rgba(255,255,255,.08)",
                      background: "#0b1220",
                    }}
                  >
                    <div className="fw-semibold">{s.actividad}</div>
                    <div className="text-muted small">
                      {s.sucursal} — {fecha} {hora} hs
                    </div>
                    <div className="text-muted small">Reserva #{r.id}</div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
