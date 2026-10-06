import { createContext, useContext, useState, type ReactNode } from "react";
import { ROLES, type Role } from "./roles";

interface AuthValue { role: Role; signIn: (role: Role) => void; signOut: () => void }
const KEY = "petcare.role";
const AuthContext = createContext<AuthValue | null>(null);

function loadRole(): Role {
  try {
    const v = localStorage.getItem(KEY) as Role | null;
    return v && ROLES.includes(v) ? v : "guest";
  } catch { return "guest"; }
}

// TODO: thay bằng đăng nhập thật khi backend có API (lưu token, đọc role từ token).
export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(loadRole);
  const save = (r: Role) => {
    setRole(r);
    try { localStorage.setItem(KEY, r); } catch { /* bỏ qua */ }
  };
  return <AuthContext.Provider value={{ role, signIn: save, signOut: () => save("guest") }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
