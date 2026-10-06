import React from 'react'
import { Alert, Button, Card, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE } from '@/utils/roles'

const Login: React.FC = () => {
  const setAuth = useAuthStore((state) => state.setAuth)

  // TODO: thay bằng authService.login khi backend có API đăng nhập.
  const demo = (role: string, name: string) => setAuth('demo-token', { id: 0, login: name.toLowerCase(), name, role })

  return (
    <Card>
      <Typography.Title level={2} style={{ marginTop: 0 }}>Sign in</Typography.Title>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Demo sign-in"
        description="The backend has no login API yet. Pick a role to preview its screens."
      />
      <Space wrap>
        <Button type="primary" onClick={() => demo(ROLE.CUSTOMER, 'Demo Customer')}>Continue as Customer</Button>
        <Button type="primary" onClick={() => demo(ROLE.ADMIN, 'Demo Admin')}>Continue as Admin</Button>
      </Space>
      <p style={{ marginBottom: 0, marginTop: 16 }}><Link to="/">Back to home</Link></p>
    </Card>
  )
}

export default Login
