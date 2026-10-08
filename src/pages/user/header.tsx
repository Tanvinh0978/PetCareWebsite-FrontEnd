import { Button, Dropdown, Layout, Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { ROLE } from '@/utils/roles'

const HomeHeader = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isAuthenticated, role, user, logout } = useAuthStore()

  const selected = pathname.startsWith('/services') ? ['/services'] : pathname === '/' ? ['/'] : []

  return (
    <Layout.Header className="home-header">
      <div className="brand" onClick={() => navigate('/')}>PetCare</div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={selected}
        onClick={({ key }) => navigate(key)}
        items={[{ key: '/', label: 'Home' }, { key: '/services', label: 'Services' }]}
        style={{ flex: 1, minWidth: 0, background: 'transparent' }}
      />
      {isAuthenticated ? (
        <Dropdown
          menu={{ items: [
            ...(role === ROLE.ADMIN ? [{ key: 'admin', label: 'Admin panel', onClick: () => navigate('/admin') }] : []),
            { key: 'my-pets', label: 'My Pets', onClick: () => navigate('/my-pets') },
            { key: 'logout', label: 'Sign out', onClick: () => { logout(); navigate('/') } },
          ] }}
        >
          <Button type="text" style={{ color: '#fff' }}>{user?.name ?? 'Account'}</Button>
        </Dropdown>
      ) : (
        <Button type="primary" onClick={() => navigate('/login')}>Sign in</Button>
      )}
    </Layout.Header>
  )
}

export default HomeHeader
