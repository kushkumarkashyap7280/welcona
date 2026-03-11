"use client";

import * as React from "react";
import { logoutAction } from "@/lib/actions/auth";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "customer" | "admin";
  verified: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: SessionUser | null;
  loading: boolean;
  logout: () => void;
  refresh: () => void;
};

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as SessionUser;
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const logout = React.useCallback(() => {
    logoutAction();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        user,
        loading,
        logout,
        refresh: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
