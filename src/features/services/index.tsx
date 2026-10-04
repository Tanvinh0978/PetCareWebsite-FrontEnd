import AdminServiceListPage from './pages/admin/ServiceListPage';
import AdminServiceDetailPage from './pages/admin/ServiceDetailPage';
import AdminServiceFormPage from './pages/admin/ServiceFormPage';
import CustomerServiceCatalogPage from './pages/customer/ServiceCatalogPage';
import CustomerServiceDetailPage from './pages/customer/ServiceDetailPage';
import GuestServiceCatalogPage from './pages/guest/ServiceCatalogPage';
import GuestServiceDetailPage from './pages/guest/ServiceDetailPage';
import type { Feature } from '../../shared/types/feature';

export const servicesFeature: Feature = {
  routes: {
    guest: [
      { path: 'services', element: <GuestServiceCatalogPage /> },
      { path: 'services/:id', element: <GuestServiceDetailPage /> },
    ],
    customer: [
      { path: 'services', element: <CustomerServiceCatalogPage /> },
      { path: 'services/:id', element: <CustomerServiceDetailPage /> },
    ],
    admin: [
      { path: 'services', element: <AdminServiceListPage /> },
      { path: 'services/new', element: <AdminServiceFormPage /> },
      { path: 'services/:id', element: <AdminServiceDetailPage /> },
      { path: 'services/:id/edit', element: <AdminServiceFormPage /> },
    ],
  },
  nav: {
    guest: [{ label: 'Services', to: 'services' }],
    customer: [{ label: 'Services', to: 'services' }],
    admin: [{ label: 'Services', to: 'services' }],
  },
};
