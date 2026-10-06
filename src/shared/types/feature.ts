import type { RouteObject } from 'react-router-dom';
import type { Role } from '../auth/roles';

export interface NavItem { label: string; to: string } // 'to' tính từ gốc khu vực, ví dụ 'services'

// Mỗi feature khai báo màn hình và mục menu cho từng vai trò được dùng nó.
export interface Feature {
  routes: Partial<Record<Role, RouteObject[]>>;
  nav: Partial<Record<Role, NavItem[]>>;
}
