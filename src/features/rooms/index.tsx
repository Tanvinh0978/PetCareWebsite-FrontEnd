import RoomListPage from './pages/RoomListPage';
import type { Feature } from '../../shared/types/feature';

export const roomsFeature: Feature = {
  routes: [{ path: 'phong', element: <RoomListPage /> }],
  nav: [{ label: 'Quản lý phòng', to: '/phong' }],
};
