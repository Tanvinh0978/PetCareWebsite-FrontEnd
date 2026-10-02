import type { RouteObject } from 'react-router-dom';

// Mỗi feature (model) export một object kiểu này để App và menu tự nhận.
export interface Feature {
  routes: RouteObject[];
  nav: { label: string; to: string }[];
}
