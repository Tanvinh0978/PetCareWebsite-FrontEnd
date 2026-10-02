import { servicesFeature } from './services';
import { staffFeature } from './staff';
import { customersFeature } from './customers';
import { petsFeature } from './pets';
import { bookingsFeature } from './bookings';
import { roomsFeature } from './rooms';
import { promotionsFeature } from './promotions';
import { reviewsFeature } from './reviews';
import { profileFeature } from './profile';
// [new-feature:imports]

// Danh sách feature của ứng dụng (thứ tự ở đây cũng là thứ tự trong sidebar).
// Script `npm run new:feature` tự thêm vào đây.
export const features = [
  servicesFeature,
  staffFeature,
  customersFeature,
  petsFeature,
  bookingsFeature,
  roomsFeature,
  promotionsFeature,
  reviewsFeature,
  profileFeature,
  // [new-feature:list]
];

export const featureRoutes = features.flatMap((f) => f.routes);
export const featureNav = features.flatMap((f) => f.nav);
