import ServiceListPage from './pages/ServiceListPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ServiceFormPage from './pages/ServiceFormPage';
import type { Feature } from '../../shared/types/feature';

export const servicesFeature: Feature = {
  routes: [
    { path: 'dich-vu', element: <ServiceListPage /> },
    { path: 'dich-vu/moi', element: <ServiceFormPage /> },
    { path: 'dich-vu/:id', element: <ServiceDetailPage /> },
    { path: 'dich-vu/:id/sua', element: <ServiceFormPage /> },
  ],
  nav: [{ label: 'Quản lý dịch vụ', to: '/dich-vu' }],
};
