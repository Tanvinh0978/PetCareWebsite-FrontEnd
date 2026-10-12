import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ROLE_BASE, type Role } from './roles';
import { useAuthStore } from '@/store/useAuthStore';

// Chỉ cho vào khu vực của đúng vai trò. Guest được chuyển tới /login, vai trò khác về khu vực của mình.
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { role: current } = useAuth();
  const token = useAuthStore((s) => s.accessToken);

  if (current === role) {
    // Với Admin và Staff, nếu không có Token thật trong Store thì điều hướng về /login
    if ((role === 'admin' || role === 'staff') && !token) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }
  return <Navigate to={current === 'guest' ? '/login' : ROLE_BASE[current]} replace />;
}

// Khu vực công khai: người đã đăng nhập được chuyển về khu vực của họ.
export function GuestOnly({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  return role === 'guest' ? <>{children}</> : <Navigate to={ROLE_BASE[role]} replace />;
}
