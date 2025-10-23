// src/utils/fakeApi.js
const USERS = [
  { username: "admin",   password: "admin123",   name: "Admin",   role: "admin" },
  { username: "cliente", password: "cliente123", name: "Cliente", role: "client" },
];

const delay = (ms) => new Promise(r => setTimeout(r, ms));

export async function fakeLogin(username, password) {
  await delay(400);
  const u = USERS.find(x => x.username === username);
  if (!u || u.password !== password) {
    // No arrojar excepciones -> devolvemos resultado controlado
    return { ok: false, error: "Usuario o contraseña inválidos" };
  }
  return {
    ok: true,
    user: { username: u.username, name: u.name, role: u.role },
  };
}
