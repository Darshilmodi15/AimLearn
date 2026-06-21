import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "../lib/api";
import type { User } from "../types";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ user: User }>("/auth/me", { retryAuth: true })
      .then((response) => {
        if (active) setUser(response.user);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const response = await apiFetch<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuth: false
    });
    setUser(response.user);
    return response.user;
  }, []);

  const signup = useCallback(async (input: { name: string; email: string; password: string }) => {
    const response = await apiFetch<{ user: User }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
      retryAuth: false
    });
    setUser(response.user);
    return response.user;
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const response = await apiFetch<{ user: User }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
      retryAuth: false
    });
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST", retryAuth: false });
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, googleLogin, logout, updateUser }),
    [user, loading, login, signup, googleLogin, logout, updateUser]
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
