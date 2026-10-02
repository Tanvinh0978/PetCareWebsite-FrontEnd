import PromotionListPage from './pages/PromotionListPage';
import type { Feature } from '../../shared/types/feature';

export const promotionsFeature: Feature = {
  routes: [{ path: 'khuyen-mai', element: <PromotionListPage /> }],
  nav: [{ label: 'Quản lý khuyến mãi', to: '/khuyen-mai' }],
};
