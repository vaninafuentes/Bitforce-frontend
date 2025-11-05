// src/context/AuthContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { Auth, tokenStore, setAuthHeader } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(() => tokenStore.get("bf_access"));
  const [refresh, setRefresh] = useState(() => tokenStore.get("bf_refresh"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("bf_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const saveTokens = useCallback((accessToken, refreshToken) => {
    if (accessToken) {
      tokenStore.set("bf_access", accessToken);
      setAccess(accessToken);
      setAuthHeader(accessToken); // <- IMPORTANTÍSIMO
    }
    if (refreshToken) {
      tokenStore.set("bf_refresh", refreshToken);
      setRefresh(refreshToken);
    }
  }, []);

  const clearSession = useCallback(() => {
    tokenStore.del("bf_access");
    tokenStore.del("bf_refresh");
    localStorage.removeItem("bf_user");
    setAuthHeader(null); // <- limpiar header
    setAccess(null);
    setRefresh(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        const tok = tokenStore.get("bf_access");
        if (tok) setAuthHeader(tok); // <- asegurar header antes del /me
        if (tok && !user) {
          const me = await Auth.me();
          const meJson = me?.data ?? me;
          setUser(meJson);
          localStorage.setItem("bf_user", JSON.stringify(meJson));
        }
      } catch {
        clearSession();
      } finally {
        setReady(true);
      }
    };
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSession, user]);

  const login = useCallback(
    async ({ username, password }) => {
      setLoading(true);
      try {
        const { data } = await Auth.login(username, password);
        saveTokens(data?.access, data?.refresh);

        let meJson = null;
        try {
          const me = await Auth.me();
          meJson = me?.data ?? me;
          setUser(meJson);
          localStorage.setItem("bf_user", JSON.stringify(meJson));
        } catch {
          const cached = localStorage.getItem("bf_user");
          meJson = cached ? JSON.parse(cached) : null;
        }
        return { ok: true, user: meJson };
      } catch (err) {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "Credenciales inválidas";
        return { ok: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [saveTokens]
  );

  const registerClient = useCallback(async (payload) => {
    setLoading(true);
    try {
      const { data } = await Auth.registerClient(payload);
      return { ok: true, data };
    } catch (err) {
      const data = err?.response?.data;
      let msg = "No se pudo registrar";
      if (typeof data === "string") msg = data;
      else if (data?.detail) msg = data.detail;
      return { ok: false, error: msg, raw: data };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const r = tokenStore.get("bf_refresh");
      await Auth.logout(r);
    } catch {}
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      access,
      refresh,
      user,
      isAuth: !!access,
      loading,
      ready,
      login,
      registerClient,
      logout,
    }),
    [access, refresh, user, loading, ready, login, registerClient, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
