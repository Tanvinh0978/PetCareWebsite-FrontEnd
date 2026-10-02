import ReviewListPage from './pages/ReviewListPage';
import type { Feature } from '../../shared/types/feature';

export const reviewsFeature: Feature = {
  routes: [{ path: 'danh-gia', element: <ReviewListPage /> }],
  nav: [{ label: 'Đánh giá', to: '/danh-gia' }],
};
