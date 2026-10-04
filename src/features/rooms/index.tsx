import RoomListPage from './pages/RoomListPage';
import type { Feature } from '../../shared/types/feature';

export const roomsFeature: Feature = {
  routes: [{ path: 'rooms', element: <RoomListPage /> }],
  nav: [{ label: 'Rooms', to: '/rooms' }],
};
