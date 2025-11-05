import React, { useEffect, useState, useCallback } from "react";
import { Users } from "../../utils/api";

const fmtDDMMYYYY = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

export default function AdminCreditos() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [alertType, setAlertType] = useState("info");
  const [creditosById, setCreditosById] = useState({});
  const [diasById, setDiasById] = useState({});
  const [sendingFor, setSendingFor] = useState(null); // id que está procesando

  const showAlert = useCallback((msg, type = "info") => {
    setAlert(msg);
    setAlertType(type);
    setTimeout(() => setAlert(null), 3500);
  }, []);

  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await Users.list();
      setUsuarios(data || []);
    } catch (e) {
      console.error(e);
      showAlert("No se pudieron cargar los usuarios.", "danger");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    loadUsuarios();
  }, [loadUsuarios]);

  const asignarCreditos = async (id) => {
    const creditos = Number(creditosById[id]);
    const dias = Number(diasById[id] || 30);

    if (!creditos || creditos <= 0)
      return showAlert("Ingresá una cantidad de créditos válida (> 0).", "danger");
    if (!dias || dias <= 0)
      return showAlert("Ingresá una cantidad de días válida (> 0).", "danger");

    try {
      setSendingFor(id);
      await Users.asignarCreditos(id, creditos, dias);
      showAlert("Créditos asignados correctamente.", "success");
      setCreditosById((prev) => ({ ...prev, [id]: "" }));
      await loadUsuarios();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        "Error al asignar créditos.";
      showAlert(msg, "danger");
    } finally {
      setSendingFor(null);
    }
  };

  const resetearCreditos = async (id) => {
    try {
      setSendingFor(id);
      await Users.resetearCreditos(id);
      showAlert("Créditos reseteados correctamente.", "warning");
      setCreditosById((prev) => ({ ...prev, [id]: "" }));
      await loadUsuarios();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.non_field_errors?.[0] ||
        "Error al resetear créditos.";
      showAlert(msg, "danger");
    } finally {
      setSendingFor(null);
    }
  };

  const onChangeCreditos = (id, val) =>
    setCreditosById((prev) => ({ ...prev, [id]: val }));

  const onChangeDias = (id, val) =>
    setDiasById((prev) => ({ ...prev, [id]: val }));

  if (loading) return <div className="text-muted">Cargando usuarios...</div>;

  return (
    <div>
      <h2 className="text-light mb-2">Gestión de Créditos</h2>
      <p className="text-muted mb-4">
        Asigná o reiniciá los créditos de cada usuario. Las fechas se muestran
        en formato <b>dd/mm/aaaa</b>.
      </p>

      {alert && (
        <div
          className={`alert alert-${alertType} text-center py-2 mb-3`}
          style={{ transition: "all 0.3s ease" }}
        >
          {alert}
        </div>
      )}

      <div
        className="table-responsive rounded-3 border"
        style={{ borderColor: "rgba(255,255,255,.1)" }}
      >
        <table className="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr className="text-muted">
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Créditos</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No hay usuarios.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => {
                const busy = sendingFor === u.id;
                return (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email || "—"}</td>
                    <td>{u.creditos ?? 0}</td>
                    <td>{fmtDDMMYYYY(u.fecha_vencimiento)}</td>
                    <td>
                      {u.activo ? (
                        <span className="text-success fw-semibold">Activo</span>
                      ) : (
                        <span className="text-danger fw-semibold">Inactivo</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2 align-items-center">
                        <input
                          type="number"
                          min="1"
                          value={creditosById[u.id] || ""}
                          onChange={(e) =>
                            onChangeCreditos(u.id, e.target.value)
                          }
                          className="form-control form-control-sm bg-dark text-light"
                          style={{ width: 90 }}
                          placeholder="Créditos"
                        />
                        <input
                          type="number"
                          min="1"
                          value={diasById[u.id] || 30}
                          onChange={(e) => onChangeDias(u.id, e.target.value)}
                          className="form-control form-control-sm bg-dark text-light"
                          style={{ width: 70 }}
                          placeholder="Días"
                          title="Días válidos"
                        />
                        <button
                          className="btn btn-sm btn-success"
                          disabled={busy}
                          onClick={() => asignarCreditos(u.id)}
                        >
                          {busy ? "..." : "Asignar"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={busy}
                          onClick={() => resetearCreditos(u.id)}
                        >
                          {busy ? "..." : "Resetear"}
                        </button>
                      </div>
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
