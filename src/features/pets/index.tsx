import PetListPage from './pages/PetListPage';
import type { Feature } from '../../shared/types/feature';

export const petsFeature: Feature = {
  routes: [{ path: 'pets', element: <PetListPage /> }],
  nav: [{ label: 'Pets', to: '/pets' }],
};
