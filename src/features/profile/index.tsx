import ProfilePage from './pages/ProfilePage';
import type { Feature } from '../../shared/types/feature';

export const profileFeature: Feature = {
  routes: [{ path: 'ho-so', element: <ProfilePage /> }],
  nav: [{ label: 'Hồ sơ cá nhân', to: '/ho-so' }],
};
