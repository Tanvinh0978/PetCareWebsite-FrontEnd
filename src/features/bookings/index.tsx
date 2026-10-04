import BookingListPage from './pages/BookingListPage';
import type { Feature } from '../../shared/types/feature';

export const bookingsFeature: Feature = {
  routes: [{ path: 'bookings', element: <BookingListPage /> }],
  nav: [{ label: 'Bookings', to: '/bookings' }],
};
