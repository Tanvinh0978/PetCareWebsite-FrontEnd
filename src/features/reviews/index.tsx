import ReviewListPage from './pages/ReviewListPage';
import type { Feature } from '../../shared/types/feature';

export const reviewsFeature: Feature = {
  routes: [{ path: 'reviews', element: <ReviewListPage /> }],
  nav: [{ label: 'Reviews', to: '/reviews' }],
};
