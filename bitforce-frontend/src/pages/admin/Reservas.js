// src/pages/admin/Reservas.js
import React, { useEffect, useMemo, useState } from "react";
import { Reservas, Users, Clases } from "../../utils/api";

const fmt = (d) => new Date(d).toLocaleString("es-AR",{ day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });

export default function AdminReservas(){
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [allUsers, setAllUsers] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [rows, setRows] = useState([]);

  const [fUser, setFUser] = useState("");
  const [fSlot, setFSlot] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [u, s, b] = await Promise.all([
        Users.list({ is_superuser: false }),
        Clases.list({ ordering: "-inicio" }),
        Reservas.list({})
      ]);
      setAllUsers(Array.isArray(u) ? u : []);
      setAllSlots(Array.isArray(s) ? s : []);
      setRows(Array.isArray(b) ? b : []);
    } catch (e) {
      console.error(e);
      setErr("No pude cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  const rowsFiltered = useMemo(()=>{
    return rows.filter(r=>{
      const uid = r.user_id || r.user || r.user_username;
      const sid = r.slot || r.slot_id || r.clase_id;
      const okU = fUser ? String(uid) === String(fUser) || String(r.user_username) === String(fUser) : true;
      const okS = fSlot ? String(sid) === String(fSlot) : true;
      return okU && okS;
    });
  }, [rows, fUser, fSlot]);

  const crearManual = async () => {
    if (!fUser || !fSlot) { alert("Elegí cliente y clase"); return; }
    try {
      await Reservas.create({ slot: Number(fSlot), user: Number(fUser) }); // si en tu endpoint admin se usa 'slot' solamente, omite 'user'
      await load();
      alert("Reserva creada");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "No se pudo crear la reserva");
    }
  };

  return (
    <div>
      <h1 className="text-light">Reservas</h1>

      <div className="toolbar">
        <select value={fUser} onChange={e=>setFUser(e.target.value)}>
          <option value="">Cliente...</option>
          {allUsers.map(u=>(
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
        <select value={fSlot} onChange={e=>setFSlot(e.target.value)}>
          <option value="">Clase...</option>
          {allSlots.map(s=>(
            <option key={s.id} value={s.id}>
              #{s.id} • {s.actividad_nombre} ({new Date(s.inicio).toLocaleString("es-AR")})
            </option>
          ))}
        </select>
        <button onClick={crearManual}>Crear reserva</button>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <table className="adm-table">
        <thead>
          <tr><th>ID</th><th>Cliente</th><th>Clase</th><th>Creado</th></tr>
        </thead>
        <tbody>
          {rowsFiltered.map(r=>(
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.user_username || r.user || "-"}</td>
              <td>
                {r.slot_info
                  ? `#${r.slot_info.id} — ${r.slot_info.actividad} — ${new Date(r.slot_info.inicio).toLocaleString("es-AR")}`
                  : `#${r.clase_id || r.slot}`}
              </td>
              <td>{fmt(r.creado)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .toolbar{ display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
        .toolbar select{ background:#121827; border:1px solid rgba(255,255,255,.08); color:#e6edf3; border-radius:10px; padding:8px 10px; min-width:220px; }
        .toolbar button{ background:#22c55e; color:#0b0b0b; border:none; border-radius:10px; padding:8px 12px; font-weight:700; }
      `}</style>
    </div>
  );
}

