import type { Feature } from '../shared/types/feature';
import type { Role } from '../shared/auth/roles';
import { servicesFeature } from './services';
// [new-feature:imports]

// Danh sách feature. Script `npm run new:feature` tự thêm vào đây.
export const features: Feature[] = [
  servicesFeature,
  // [new-feature:list]
];

export const featureRoutes = (role: Role) => features.flatMap((f) => f.routes[role] ?? []);
export const featureNav = (role: Role) => features.flatMap((f) => f.nav[role] ?? []);
