import { useRoutes, type RouteObject } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireRole, { GuestOnly } from "@/auth/RequireRole";
import ServiceCatalog from "@/components/service/ServiceCatalog";
import ServiceDetail from "@/components/service/ServiceDetail";
import PawstayAuthPage from "@/pages/auth/PawstayAuthPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import HomePage from "@/pages/customer/HomePage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminServiceListPage from "@/pages/admin/service/ServiceListPage";
import AdminServiceFormPage from "@/pages/admin/service/ServiceFormPage";
import AdminCustomerListPage from "@/pages/admin/customer/CustomerListPage";
import AdminCustomerFormPage from "@/pages/admin/customer/CustomerFormPage";
import AdminRoomTypeListPage from "@/pages/admin/roomType/RoomTypeListPage";
import AdminRoomTypeFormPage from "@/pages/admin/roomType/RoomTypeFormPage";
import AdminRoomListPage from "@/pages/admin/room/RoomListPage";
import AdminRoomFormPage from "@/pages/admin/room/RoomFormPage";
import StaffDashboardPage from "@/pages/staff/StaffDashboardPage";
import AdminPetListPage from "@/pages/admin/pet/PetListPage";
import AdminPetFormPage from "@/pages/admin/pet/PetFormPage";
import StaffPetListPage from "@/pages/staff/pet/StaffPetListPage";
import StaffPetFormPage from "@/pages/staff/pet/StaffPetFormPage";
import CustomerPetListPage from "@/pages/customer/pet/CustomerPetListPage";
import CustomerPetFormPage from "@/pages/customer/pet/CustomerPetFormPage";
import AdminStaffListPage from "@/pages/admin/staff/StaffListPage";
import AdminStaffFormPage from "@/pages/admin/staff/StaffFormPage";
import AdminVoucherListPage from "@/pages/admin/voucher/VoucherListPage";
import AdminVoucherFormPage from "@/pages/admin/voucher/VoucherFormPage";
// [new-page:imports]

const notFound: RouteObject = { path: "*", element: <NotFoundPage /> };

// Danh sách màn hình dùng chung cho guest (gốc "/") và customer ("/customer").
const publicServiceRoutes = (base: string, guest = false): RouteObject[] => [
  { path: "services", element: <ServiceCatalog detailBase={base + "/services"} showSignInHint={guest} /> },
  { path: "services/:id", element: <ServiceDetail backTo={base + "/services"} /> },
];

export default function AppRoutes() {
  return useRoutes([
    { path: "/login", element: <PawstayAuthPage /> },
    { path: "/register", element: <PawstayAuthPage /> },
    { path: "/verify-otp", element: <PawstayAuthPage /> },
    {
      path: "/admin",
      element: <Layout role="admin" />,
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: "services", element: <AdminServiceListPage /> },
        { path: "services/new", element: <AdminServiceFormPage /> },   // Add: màn riêng
        { path: "services/:id", element: <ServiceDetail backTo="/admin/services" editTo={(id) => `/admin/services/${id}/edit`} /> },
        { path: "services/:id/edit", element: <AdminServiceFormPage /> }, // Edit: màn riêng
        { path: "customers", element: <AdminCustomerListPage /> },
        { path: "customers/new", element: <AdminCustomerFormPage /> },
        { path: "customers/:id/edit", element: <AdminCustomerFormPage /> },
        { path: "room-types", element: <AdminRoomTypeListPage /> },
        { path: "room-types/new", element: <AdminRoomTypeFormPage /> },
        { path: "room-types/:id/edit", element: <AdminRoomTypeFormPage /> },
        { path: "rooms", element: <AdminRoomListPage /> },
        { path: "rooms/new", element: <AdminRoomFormPage /> },
        { path: "rooms/:id/edit", element: <AdminRoomFormPage /> },
        { path: "pets", element: <AdminPetListPage /> },
        { path: "pets/new", element: <AdminPetFormPage /> },
        { path: "pets/:id/edit", element: <AdminPetFormPage /> },
        { path: "staff", element: <AdminStaffListPage /> },
        { path: "staff/new", element: <AdminStaffFormPage /> },
        { path: "staff/:id/edit", element: <AdminStaffFormPage /> },
        { path: "vouchers", element: <AdminVoucherListPage /> },
        { path: "vouchers/new", element: <AdminVoucherFormPage /> },
        { path: "vouchers/:id/edit", element: <AdminVoucherFormPage /> },
        // [new-page:admin]
        notFound,
      ],
    },
    {
      path: "/staff",
      element: <RequireRole role="staff"><Layout role="staff" /></RequireRole>,
      children: [
        { index: true, element: <StaffDashboardPage /> },
        { path: "pets", element: <StaffPetListPage /> },
        { path: "pets/new", element: <StaffPetFormPage /> },
        { path: "pets/:id/edit", element: <StaffPetFormPage /> },
        // [new-page:staff]
        notFound,
      ],
    },
    {
      path: "/customer",
      element: <RequireRole role="customer"><Layout role="customer" /></RequireRole>,
      children: [
        { index: true, element: <HomePage /> },
        ...publicServiceRoutes("/customer"),
        { path: "pets", element: <CustomerPetListPage /> },
        { path: "pets/new", element: <CustomerPetFormPage /> },
        { path: "pets/:id/edit", element: <CustomerPetFormPage /> },
        // [new-page:customer]
        notFound,
      ],
    },
    {
      path: "/",
      element: <GuestOnly><Layout role="guest" /></GuestOnly>,
      children: [
        { index: true, element: <HomePage /> },
        ...publicServiceRoutes("", true),
        notFound,
      ],
    },
  ]);
}
