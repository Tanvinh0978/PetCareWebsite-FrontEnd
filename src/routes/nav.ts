import type { Role } from "@/auth/roles";

export interface NavItem { label: string; to: string } // "to" tính từ gốc khu vực, ví dụ "services"

// Mục menu bên trái cho từng vai trò.
export const NAV: Record<Role, NavItem[]> = {
  guest: [{ label: "Services", to: "services" }],
  customer: [
    { label: "Services", to: "services" },
    // [new-page:nav-customer]
  ],
  staff: [
    // [new-page:nav-staff]
  ],
  admin: [
    { label: "Services", to: "services" },
    { label: "Customers", to: "customers" },
    // [new-page:nav-admin]
  ],
};
