import React from 'react'
import { Outlet } from 'react-router-dom'

const AuthLayout: React.FC = () => (
  <div className="auth-bg">
    <div className="auth-card">
      <Outlet />
    </div>
  </div>
)

export default AuthLayout
