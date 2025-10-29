// src/pages/client/Creditos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Auth, Reservas } from "../../utils/api";

/* ===== Helpers ===== */
const pad = (n) => String(n).padStart(2, "0");
const ddmmyyyy = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(x, hi));

export default function CreditosCliente() {
  const [me, setMe] = useState(null);
  const [usados, setUsados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Período: si falta fecha_activacion, usamos (vencimiento - 30 días)
  const periodo = useMemo(() => {
    if (!me?.fecha_vencimiento) return null;
    const hasta = new Date(me.fecha_vencimiento);
    const desde = me?.fecha_activacion
      ? new Date(me.fecha_activacion)
      : addDays(hasta, -30); // <-- fallback de 30 días
    return { desde, hasta };
  }, [me]);

  const estaDentroDelPeriodo = (iso) => {
    if (!periodo) return false;
    const t = new Date(iso);
    return t >= periodo.desde && t <= periodo.hasta;
  };

  const contarUsados = async (perfil) => {
    // Cuenta SOLO clases que ya ocurrieron dentro del período
    let usadosCalc = 0;
    if (perfil?.id && periodo) {
      const all = await Reservas.list({ ordering: "-creado" });
      const mias = (all || []).filter((b) => (b.user_info?.id ?? b.user) === perfil.id);
      const ahora = new Date();
      usadosCalc = mias.filter((b) => {
        const ini = b.slot_info?.inicio;
        if (!ini) return false;
        const inicio = new Date(ini);
        return inicio <= ahora && estaDentroDelPeriodo(inicio);
      }).length;
    }
    setUsados(usadosCalc);
  };

  const cargar = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const yo = await Auth.me();
      setMe(yo);
      await contarUsados(yo);
    } catch (e) {
      console.error(e);
      setMsg({ type: "danger", text: "No pude cargar tus créditos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  // Disponibles = créditos del perfil - usados (no bajamos por reservas futuras)
  const disponibles = clamp((me?.creditos ?? 0) - usados, 0, 9999);
  const vencido = me?.fecha_vencimiento && new Date(me.fecha_vencimiento) < new Date();

  return (
    <div>
      <div className="d-flex align-items-end justify-content-between mb-3">
        <h2 className="text-light mb-0">Mis créditos</h2>
        <button className="btn btn-outline-light" onClick={cargar}>Actualizar</button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="text-center text-muted py-4">Cargando…</div>
      ) : (
        <div
          className="p-4 rounded-3 border"
          style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}
        >
          <div className="row g-4">
            <div className="col-12 col-md-6">
              <div className="text-muted">Créditos totales</div>
              <div className="display-6">{me?.creditos ?? 0}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted">Usados</div>
              <div className="h3 mb-0">{usados}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted">Disponibles</div>
              <div className="h3 mb-0">{disponibles}</div>
            </div>
          </div>

          <hr className="border-secondary my-4" />

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="text-muted">Inicio del período</div>
              <div className="fw-semibold">
                {ddmmyyyy(periodo?.desde ?? me?.fecha_activacion)}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="text-muted">Vencimiento</div>
              <div className="fw-semibold">{ddmmyyyy(me?.fecha_vencimiento)}</div>
            </div>
            <div className="col-12 col-md-4">
              <div className="text-muted">Estado</div>
              {vencido ? (
                <span className="badge bg-danger">Vencido</span>
              ) : (
                <span className="badge bg-success">Activo</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
