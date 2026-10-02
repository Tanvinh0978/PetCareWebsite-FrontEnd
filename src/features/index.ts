import { servicesFeature } from './services';
// [new-feature:imports]

// Danh sách feature của ứng dụng. Script `npm run new:feature` tự thêm vào đây.
export const features = [
  servicesFeature,
  // [new-feature:list]
];

export const featureRoutes = features.flatMap((f) => f.routes);
export const featureNav = features.flatMap((f) => f.nav);
