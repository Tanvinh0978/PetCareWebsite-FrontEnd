import type { Role } from "@/auth/roles";

export interface NavItem { label: string; to: string } // "to" tính từ gốc khu vực, ví dụ "services"

// Mục menu bên trái cho từng vai trò.
export const NAV: Record<Role, NavItem[]> = {
  guest: [{ label: "Services", to: "services" }],
  customer: [
    { label: "Services", to: "services" },
    { label: "My Pets", to: "pets" },
    { label: "Book Now", to: "booking" },
    // [new-page:nav-customer]
  ],
  staff: [
    { label: "Pets", to: "pets" },
    // [new-page:nav-staff]
  ],
  admin: [
    { label: "Services", to: "services" },
    { label: "Customers", to: "customers" },
    { label: "Pets", to: "pets" },
    { label: "Staff", to: "staff" },
    { label: "Room Types", to: "room-types" },
    { label: "Rooms", to: "rooms" },
    // [new-page:nav-admin]
  ],
};
