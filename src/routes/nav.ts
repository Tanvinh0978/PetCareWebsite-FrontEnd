import type { Role } from "@/auth/roles";

export interface NavItem { label: string; to: string } // "to" tính từ gốc khu vực, ví dụ "services"

// Mục menu bên trái cho từng vai trò.
export const NAV: Record<Role, NavItem[]> = {
  guest: [
    { label: "Services", to: "services" },
    { label: "Room Types", to: "room-types" },
  ],
  customer: [
    { label: "Services", to: "services" },
    { label: "Room Types", to: "room-types" },
    { label: "Book Now", to: "booking" },
    // [new-page:nav-customer]
  ],
  staff: [
    { label: "Bookings", to: "bookings" },
    { label: "Grooming Tasks", to: "grooming-tasks" },
    { label: "Manage Boarding", to: "manage-boarding" },
    { label: "Pets", to: "pets" },
    { label: "Reviews", to: "reviews" },
    // [new-page:nav-staff]
  ],
  admin: [
    { label: "Bookings", to: "bookings" },
    { label: "Services", to: "services" },
    { label: "Bookings", to: "bookings" },
    { label: "Customers", to: "customers" },
    { label: "Grooming Tasks", to: "grooming-tasks" },
    { label: "Manage Boarding", to: "manage-boarding" },
    { label: "Reviews", to: "reviews" },
    { label: "Pets", to: "pets" },
    { label: "Staff", to: "staff" },
    { label: "Roles & Permissions", to: "roles" },
    { label: "Room Types", to: "room-types" },
    { label: "Rooms", to: "rooms" },
    { label: "Vouchers", to: "vouchers" },
    // [new-page:nav-admin]
  ],
};
