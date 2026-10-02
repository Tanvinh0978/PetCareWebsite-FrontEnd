import ServiceListPage from './pages/ServiceListPage';
import ServiceFormPage from './pages/ServiceFormPage';
import type { Feature } from '../../shared/types/feature';

export const servicesFeature: Feature = {
  routes: [
    { path: 'dich-vu', element: <ServiceListPage /> },
    { path: 'quan-ly/dich-vu/moi', element: <ServiceFormPage /> },
  ],
  nav: [
    { label: 'Dịch vụ', to: '/dich-vu' },
    { label: 'Thêm dịch vụ', to: '/quan-ly/dich-vu/moi' },
  ],
};
