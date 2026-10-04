import ProfilePage from './pages/ProfilePage';
import type { Feature } from '../../shared/types/feature';

export const profileFeature: Feature = {
  routes: [{ path: 'profile', element: <ProfilePage /> }],
  nav: [{ label: 'My profile', to: '/profile' }],
};
