import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ProLayout } from '@ant-design/pro-components'
import { Dropdown } from 'antd'
import { CustomerServiceOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/store/useAuthStore'

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Thêm mục menu admin mới ở đây (mỗi feature một mục).
  const menuRoutes = [
    { path: '/admin/services', name: 'Services', icon: <CustomerServiceOutlined /> },
  ]

  return (
    <ProLayout
      title="PetCare Admin"
      logo={false}
      layout="side"
      fixSiderbar
      location={{ pathname: location.pathname }}
      route={{ path: '/admin', routes: menuRoutes }}
      menuItemRender={(item, dom) => <a onClick={() => item.path && navigate(item.path)}>{dom}</a>}
      avatarProps={{
        icon: <UserOutlined />,
        title: user?.name ?? 'Admin',
        size: 'small',
        render: (_props, dom) => (
          <Dropdown
            menu={{ items: [
              { key: 'site', label: 'View website', onClick: () => navigate('/') },
              { key: 'logout', icon: <LogoutOutlined />, label: 'Sign out', onClick: handleLogout },
            ] }}
          >
            {dom}
          </Dropdown>
        ),
      }}
    >
      <Outlet />
    </ProLayout>
  )
}

export default AdminLayout
