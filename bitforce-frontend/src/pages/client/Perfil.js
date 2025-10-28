import React, { useEffect, useState } from "react";
import { Auth } from "../../utils/api";

export default function PerfilCliente() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const yo = await Auth.me();
        setMe(yo);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-muted">Cargando…</div>;
  if (!me) return <div className="text-muted">No se pudo cargar el perfil.</div>;

  return (
    <div className="container-sm">
      <h2 className="text-light mb-3">Mi perfil</h2>
      <div
        className="p-4 rounded-3 border"
        style={{ borderColor: "rgba(255,255,255,.1)", background: "#0e1526" }}
      >
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="text-muted">Usuario</div>
            <div className="fw-semibold">{me.username}</div>
          </div>
          <div className="col-12 col-md-6">
            <div className="text-muted">Email</div>
            <div className="fw-semibold">{me.email || "—"}</div>
          </div>
          <div className="col-12 col-md-6">
            <div className="text-muted">Rol</div>
            <div className="fw-semibold">{me.rol}</div>
          </div>
          <div className="col-12 col-md-6">
            <div className="text-muted">Estado</div>
            <span className={`badge ${me.is_active ? "bg-success" : "bg-secondary"}`}>
              {me.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
