import PromotionListPage from './pages/PromotionListPage';
import type { Feature } from '../../shared/types/feature';

export const promotionsFeature: Feature = {
  routes: [{ path: 'promotions', element: <PromotionListPage /> }],
  nav: [{ label: 'Promotions', to: '/promotions' }],
};
