import PetListPage from './pages/PetListPage';
import type { Feature } from '../../shared/types/feature';

export const petsFeature: Feature = {
  routes: [{ path: 'thu-cung', element: <PetListPage /> }],
  nav: [{ label: 'Quản lý thú cưng', to: '/thu-cung' }],
};
