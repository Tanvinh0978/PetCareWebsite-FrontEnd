import ServiceListPage from './pages/ServiceListPage';
import ServiceFormPage from './pages/ServiceFormPage';
import type { Feature } from '../../shared/types/feature';

export const servicesFeature: Feature = {
  routes: [
    { path: 'dich-vu', element: <ServiceListPage /> },
    { path: 'dich-vu/moi', element: <ServiceFormPage /> },
  ],
  nav: [{ label: 'Quản lý dịch vụ', to: '/dich-vu' }],
};
