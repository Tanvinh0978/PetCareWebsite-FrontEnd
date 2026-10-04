import StaffListPage from './pages/StaffListPage';
import type { Feature } from '../../shared/types/feature';

export const staffFeature: Feature = {
  routes: [{ path: 'staff', element: <StaffListPage /> }],
  nav: [{ label: 'Staff', to: '/staff' }],
};
