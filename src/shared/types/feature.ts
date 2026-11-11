import type { RouteObject } from 'react-router-dom';
import type { Role } from '../auth/roles';

export interface NavItem { label: string; to: string }

export interface Feature {
  routes: Partial<Record<Role, RouteObject[]>>;
  nav: Partial<Record<Role, NavItem[]>>;
}
