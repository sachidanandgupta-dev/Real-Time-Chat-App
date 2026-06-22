import { useState, useCallback } from "react";
import api from "../api/axios";
import { AuthContext } from "./auth-context-base";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("chatUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const persistSession = (data) => {
    const { token, ...userData } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("chatUser", JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      persistSession(data);
      return true;
    } catch (err) {
      setAuthError(err.response?.data?.message || "Login failed. Please try again.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { data } = await api.post("/auth/register", { username, email, password });
      persistSession(data);
      return true;
    } catch (err) {
      setAuthError(err.response?.data?.message || "Registration failed. Please try again.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("chatUser");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, authLoading, authError, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}
