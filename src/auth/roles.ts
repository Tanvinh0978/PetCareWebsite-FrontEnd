export type Role = "guest" | "customer" | "staff" | "admin";
export const ROLES: Role[] = ["guest", "customer", "staff", "admin"];

export const ROLE_BASE: Record<Role, string> = { guest: "", customer: "/customer", staff: "/staff", admin: "/admin" };
export const ROLE_LABEL: Record<Role, string> = { guest: "Guest", customer: "Customer", staff: "Staff", admin: "Admin" };
