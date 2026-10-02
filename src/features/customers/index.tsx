import CustomerListPage from './pages/CustomerListPage';
import type { Feature } from '../../shared/types/feature';

export const customersFeature: Feature = {
  routes: [{ path: 'khach-hang', element: <CustomerListPage /> }],
  nav: [{ label: 'Quản lý khách hàng', to: '/khach-hang' }],
};
