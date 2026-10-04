import CustomerListPage from './pages/CustomerListPage';
import type { Feature } from '../../shared/types/feature';

export const customersFeature: Feature = {
  routes: [{ path: 'customers', element: <CustomerListPage /> }],
  nav: [{ label: 'Customers', to: '/customers' }],
};
