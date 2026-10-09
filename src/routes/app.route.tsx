import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '@/components/protected.route.tsx'
import AuthLayout from '@/layouts/auth.layout.tsx'
import AdminLayout from '@/layouts/admin.layout.tsx'
import HomeLayout from '@/pages/user/layout.tsx'
import Login from '@/pages/auth/Login.tsx'
import ForbiddenPage from '@/pages/errors/forbidden.tsx'
import NotFoundPage from '@/pages/errors/not.found.tsx'
import HomePage from '@/pages/user/home/page.tsx'
import ServiceListPage from '@/pages/user/services/service.list.page.tsx'
import ServiceDetailPage from '@/pages/user/services/service.detail.page.tsx'
import ServiceManagement from '@/pages/admin/service/service.management.tsx'
import AdminServiceDetail from '@/pages/admin/service/service.detail.tsx'
import MyPetsPage from '@/pages/customer/MyPetsPage.tsx'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE } from '@/utils/roles'

const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore()

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={role === ROLE.ADMIN ? '/admin/services' : '/'} replace /> : <Login />}
        />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute requiredRole={ROLE.ADMIN} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/services" replace />} />
          <Route path="/admin/services" element={<ServiceManagement />} />
          <Route path="/admin/services/:id" element={<AdminServiceDetail />} />
        </Route>
      </Route>

      {/* Guest + customer routes */}
      <Route element={<HomeLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServiceListPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/my-pets" element={<MyPetsPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Customer-only routes (thêm khi có màn: ví dụ /you/account, /tickets)
      <Route element={<ProtectedRoute requiredRole={ROLE.CUSTOMER} />}>
        <Route element={<HomeLayout />}> ... </Route>
      </Route> */}
    </Routes>
  )
}

export default AppRoutes
