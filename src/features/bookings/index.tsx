import BookingListPage from './pages/BookingListPage';
import type { Feature } from '../../shared/types/feature';

export const bookingsFeature: Feature = {
  routes: [{ path: 'dat-lich', element: <BookingListPage /> }],
  nav: [{ label: 'Quản lý đặt lịch', to: '/dat-lich' }],
};
