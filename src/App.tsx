import { useRoutes } from 'react-router-dom';
import Layout from './shared/components/Layout';
import RequireRole, { GuestOnly } from './shared/auth/RequireRole';
import Home from './pages/Home';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import { featureRoutes } from './features';

const notFound = { path: '*', element: <NotFound /> };

export default function App() {
  return useRoutes([
    { path: '/login', element: <LoginPage /> },
    {
      path: '/admin',
      element: <RequireRole role="admin"><Layout role="admin" /></RequireRole>,
      children: [{ index: true, element: <DashboardPage /> }, ...featureRoutes('admin'), notFound],
    },
    {
      path: '/customer',
      element: <RequireRole role="customer"><Layout role="customer" /></RequireRole>,
      children: [{ index: true, element: <Home /> }, ...featureRoutes('customer'), notFound],
    },
    {
      path: '/',
      element: <GuestOnly><Layout role="guest" /></GuestOnly>,
      children: [{ index: true, element: <Home /> }, ...featureRoutes('guest'), notFound],
    },
  ]);
}
