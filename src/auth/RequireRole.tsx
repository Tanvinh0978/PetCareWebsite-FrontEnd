import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLE_BASE, type Role } from './roles';
import { useAuthStore } from '@/store/useAuthStore';

export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { role: current } = useAuth();
  const token = useAuthStore((s) => s.accessToken);

  if (current === role) {
    if ((role === 'admin' || role === 'staff') && !token) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }
  return <Navigate to={current === 'guest' ? '/login' : ROLE_BASE[current]} replace />;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  return role === 'guest' ? <>{children}</> : <Navigate to={ROLE_BASE[role]} replace />;
}
