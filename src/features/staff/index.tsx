import StaffListPage from './pages/StaffListPage';
import type { Feature } from '../../shared/types/feature';

export const staffFeature: Feature = {
  routes: [{ path: 'nhan-vien', element: <StaffListPage /> }],
  nav: [{ label: 'Quản lý nhân viên', to: '/nhan-vien' }],
};
