import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "master" | "comercial" | "marketing" | "financeiro" | "rh" | "suporte";

interface User {
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  canAccess: (page: string) => boolean;
}

const rolePermissions: Record<UserRole, string[]> = {
  master: ["overview", "clients", "sales", "services", "marketing", "financial", "cashflow", "hr", "tv"],
  comercial: ["clients", "sales", "services", "marketing"],
  marketing: ["clients", "sales", "services", "marketing"],
  financeiro: ["overview", "clients", "sales", "services", "marketing", "financial", "cashflow", "tv"],
  rh: ["hr"],
  suporte: ["overview", "clients", "sales", "services", "marketing", "financial", "cashflow", "hr", "tv"],
};

const roleNames: Record<UserRole, string> = {
  master: "Usuário Master",
  comercial: "Comercial",
  marketing: "Marketing",
  financeiro: "Financeiro",
  rh: "Recursos Humanos",
  suporte: "Suporte",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem("userRole") as UserRole | null;
    if (savedRole && rolePermissions[savedRole]) {
      return { role: savedRole, name: roleNames[savedRole] };
    }
    return null;
  });

  const login = (role: UserRole) => {
    localStorage.setItem("userRole", role);
    setUser({ role, name: roleNames[role] });
  };

  const logout = () => {
    localStorage.removeItem("userRole");
    setUser(null);
  };

  const canAccess = (page: string) => {
    if (!user) return false;
    return rolePermissions[user.role].includes(page);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export { roleNames, rolePermissions };
