import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import HomeHeader from '@/pages/user/header.tsx'
import HomeFooter from '@/pages/user/footer.tsx'

const HomeLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <HomeHeader />
    <Layout.Content>
      <Outlet />
    </Layout.Content>
    <HomeFooter />
  </Layout>
)

export default HomeLayout
