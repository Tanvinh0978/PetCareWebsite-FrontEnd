import ServiceListPage from './pages/ServiceListPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ServiceFormPage from './pages/ServiceFormPage';
import type { Feature } from '../../shared/types/feature';

export const servicesFeature: Feature = {
  routes: [
    { path: 'services', element: <ServiceListPage /> },
    { path: 'services/moi', element: <ServiceFormPage /> },
    { path: 'services/:id', element: <ServiceDetailPage /> },
    { path: 'services/:id/sua', element: <ServiceFormPage /> },
  ],
  nav: [{ label: 'Services', to: '/services' }],
};
