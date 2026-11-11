export type Role = 'guest' | 'customer' | 'admin';
export const ROLES: Role[] = ['guest', 'customer', 'admin'];

export const ROLE_BASE: Record<Role, string> = { guest: '', customer: '/customer', admin: '/admin' };
export const ROLE_LABEL: Record<Role, string> = { guest: 'Guest', customer: 'Customer', admin: 'Admin' };
