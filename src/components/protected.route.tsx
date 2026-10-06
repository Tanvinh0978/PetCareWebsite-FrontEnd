import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

interface ProtectedRouteProps {
  requiredRole?: string
  allowedRoles?: string[]
}

// Chưa đăng nhập -> /login. Đã đăng nhập nhưng sai vai trò -> /403.
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, allowedRoles }) => {
  const { isAuthenticated, role } = useAuthStore()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && role !== requiredRole) return <Navigate to="/403" replace />
  if (allowedRoles && (!role || !allowedRoles.includes(role))) return <Navigate to="/403" replace />

  return <Outlet />
}

export default ProtectedRoute
