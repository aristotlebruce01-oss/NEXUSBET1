import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // null = loading, false = logged out, object = logged in
  const [ready, setReady] = useState(false);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("nexus_token");
    if (!token) {
      setUser(false);
      setReady(true);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      localStorage.removeItem("nexus_token");
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (identifier, password) => {
    const { data } = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("nexus_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, phone, password, confirm_password, referral_code) => {
    const { data } = await api.post("/auth/register", { name, email, phone, password, confirm_password, referral_code });
    localStorage.setItem("nexus_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("nexus_token");
    setUser(false);
  };

  const setBalance = (balance) => {
    setUser((u) => (u ? { ...u, balance } : u));
  };

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, setBalance, setUser, reload: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { formatApiErrorDetail };
