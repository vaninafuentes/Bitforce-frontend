import axios from "axios";

console.log("API_BASE =>", API_BASE);

/* ===== BASE ===== */
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api";
const AUTH_STRATEGY = process.env.REACT_APP_AUTH_STRATEGY || "jwt";

/* ===== TOKEN STORE ===== */
export const tokenStore = {
  get: (k) => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  del: (k) => localStorage.removeItem(k),
};

/* ===== AXIOS ===== */
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: AUTH_STRATEGY === "session",
});

// 👉 util para setear / limpiar el header de autorización
export const setAuthHeader = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

// al boot: si ya había un token guardado, lo cargamos al header
const bootToken = tokenStore.get("bf_access");
if (bootToken) setAuthHeader(bootToken);

// (opcional) interceptor: si por lo que sea no estaba el default, lee de storage
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = tokenStore.get("bf_access");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { AUTH_STRATEGY };

/* Helper unwrap axios -> data */
const d = (p) => p.then((r) => r.data);

/* ===== ENDPOINTS ===== */
// --- Auth ---
export const Auth = {
  login:   (username, password) => api.post("/token/", { username, password }),
  refresh: (refresh)            => d(api.post("/token/refresh/", { refresh })),
  verify:  (token)              => d(api.post("/token/verify/", { token })),
  logout:  (refresh)            => d(api.post("/logout/", { refresh })),
  me:      ()                   => d(api.get("/me/")),

  // Registro público (sin auth): crea usuario inactivo para que el admin lo active
  publicRegister: (payload)     => d(api.post("/register/", payload)),

  // Creador de clientes por admin (si lo usás)
  registerClient: (payload)     => d(api.post("/AccountAdmin/api/clients/", payload)),
};

// --- Users (admin) ---
export const Users = {
  list:         (params)      => d(api.get("/AccountAdmin/GymUser/", { params })),
  create:       (payload)     => d(api.post("/AccountAdmin/GymUser/", payload)),
  get:          (id)          => d(api.get(`/AccountAdmin/GymUser/${id}/`)),
  update:       (id, payload) => d(api.patch(`/AccountAdmin/GymUser/${id}/`, payload)),
  remove:       (id)          => d(api.delete(`/AccountAdmin/GymUser/${id}/`)),
  toggleActive: (id, is_active)=> d(api.patch(`/AccountAdmin/GymUser/${id}/`, { is_active })),

  // Acciones personalizadas del ViewSet
  asignarCreditos:  (id, creditos, dias = 30) =>
    d(api.post(`/AccountAdmin/GymUser/${id}/asignar_creditos/`, { creditos, dias })),
  resetearCreditos: (id) =>
    d(api.post(`/AccountAdmin/GymUser/${id}/resetear_creditos/`)),

  // (compat) por si en algún componente quedó esta forma
  customAction: (id, action, payload = {}) =>
    d(api.post(`/AccountAdmin/GymUser/${id}/${action}/`, payload)),
};

// --- Branch ---
export const Branch = {
  list:   (params)      => d(api.get("/branch/", { params })),
  create: (payload)     => d(api.post("/branch/", payload)),
  get:    (id)          => d(api.get(`/branch/${id}/`)),
  update: (id, payload) => d(api.put(`/branch/${id}/`, payload)),
  remove: (id)          => d(api.delete(`/branch/${id}/`)),
};

// --- Coach ---
export const Coach = {
  list:   (params)      => d(api.get("/coach/", { params })),
  create: (payload)     => d(api.post("/coach/", payload)),
  get:    (id)          => d(api.get(`/coach/${id}/`)),
  update: (id, payload) => d(api.put(`/coach/${id}/`, payload)),
  remove: (id)          => d(api.delete(`/coach/${id}/`)),
};

// --- Actividades ---
export const Actividades = {
  list:   (params)      => d(api.get("/activity/", { params })),
  create: (payload)     => d(api.post("/activity/", payload)),
  get:    (id)          => d(api.get(`/activity/${id}/`)),
  update: (id, payload) => d(api.put(`/activity/${id}/`, payload)),
  remove: (id)          => d(api.delete(`/activity/${id}/`)),
};

// --- Clases programadas ---
export const Clases = {
  list:   (params)      => d(api.get("/claseprogramada/", { params })),
  create: (payload)     => d(api.post("/claseprogramada/", payload)),
  get:    (id)          => d(api.get(`/claseprogramada/${id}/`)),
  update: (id, payload) => d(api.put(`/claseprogramada/${id}/`, payload)),
  remove: (id)          => d(api.delete(`/claseprogramada/${id}/`)),
  reservas: (id) => d(api.get(`/claseprogramada/${id}/reservas/`)),
};

// --- Reservas ---
export const Reservas = {
  list:        (params)   => d(api.get("/booking/", { params })),              // GET
  create:      (payload)  => d(api.post("/bookings/reservar/", payload)),      // POST {slot}
  get:         (id)       => d(api.get(`/booking/${id}/`)),                    // GET detalle
  adminCreate: (payload)  => d(api.post("/admin/bookings/create/", payload)),  // Admin
  remove:      (id)       => d(api.delete(`/booking/${id}/`)),                 // DELETE
};
