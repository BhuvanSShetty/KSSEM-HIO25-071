import React, { createContext, useContext, useEffect, useState } from "react";

const AuthCtx = createContext(null);
const LS_KEY = "ks.auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, role, token, farmerId? }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      console.error("Auth load error", e);
    }
  }, []);

  const login = (payload) => {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setUser(payload);
  };

  const logout = () => {
    localStorage.removeItem(LS_KEY);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}

export function getToken() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY))?.token || "";
  } catch {
    return "";
  }
}
