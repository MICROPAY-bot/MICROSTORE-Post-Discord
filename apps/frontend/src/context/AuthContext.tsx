import { createContext, useContext, useState, ReactNode } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "buyer";
  buyerToken?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, user: AuthUser, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function login(token: string, user: AuthUser, refreshToken?: string) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
