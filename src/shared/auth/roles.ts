// Vai trò của giao diện. Backend chưa có API đăng nhập nên hiện chọn vai trò thử ở /login.
export type Role = 'guest' | 'customer' | 'admin';
export const ROLES: Role[] = ['guest', 'customer', 'admin'];

// Tiền tố URL của từng khu vực. Guest dùng gốc '/'.
export const ROLE_BASE: Record<Role, string> = { guest: '', customer: '/customer', admin: '/admin' };
export const ROLE_LABEL: Record<Role, string> = { guest: 'Guest', customer: 'Customer', admin: 'Admin' };
