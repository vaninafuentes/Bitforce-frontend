// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";

// Usuarios “seed” de prueba
const SEED_USERS = [
  { username: "admin",  password: "admin123",  name: "Admin",   role: "admin"  },
  { username: "cliente", password: "cliente123", name: "Cliente", role: "client" },
];

const STORAGE_KEY = "bf_users_v1";
const SESSION_KEY = "bf_session_v1";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(() => {
    // lee users de localStorage o inicializa con seed
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const login = async ({ username, password }) => {
    const u = users.find((x) => x.username === username);
    await new Promise((r) => setTimeout(r, 300)); // “latencia” fake
    if (!u || u.password !== password) {
      throw new Error("Usuario o contraseña incorrectos");
    }
    const session = { username: u.username, name: u.name, role: u.role };
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const register = async ({ name, username, password }) => {
    await new Promise((r) => setTimeout(r, 200));
    // validar duplicado
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("El usuario ya existe");
    }
    const newUser = { name, username, password, role: "client" };
    setUsers((prev) => [...prev, newUser]);
    // login automático post-registro (opcional)
    const session = { username, name, role: "client" };
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
