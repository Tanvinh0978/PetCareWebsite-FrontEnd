import { useRoutes, type RouteObject } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireRole, { GuestOnly } from "@/auth/RequireRole";
import ServiceCatalog from "@/components/service/ServiceCatalog";
import ServiceDetail from "@/components/service/ServiceDetail";
import LoginPage from "@/pages/auth/LoginPage";
import NotFoundPage from "@/pages/errors/NotFoundPage";
import HomePage from "@/pages/customer/HomePage";
import AdminDashboardPage from "@/pages/admin/DashboardPage";
import AdminServiceListPage from "@/pages/admin/service/ServiceListPage";
import AdminServiceFormPage from "@/pages/admin/service/ServiceFormPage";
import AdminCustomerListPage from "@/pages/admin/customer/CustomerListPage";
import AdminCustomerFormPage from "@/pages/admin/customer/CustomerFormPage";
import AdminRoomTypeListPage from "@/pages/admin/roomType/RoomTypeListPage";
import AdminRoomTypeFormPage from "@/pages/admin/roomType/RoomTypeFormPage";
import StaffDashboardPage from "@/pages/staff/StaffDashboardPage";
// [new-page:imports]

const notFound: RouteObject = { path: "*", element: <NotFoundPage /> };

// Danh sách màn hình dùng chung cho guest (gốc "/") và customer ("/customer").
const publicServiceRoutes = (base: string, guest = false): RouteObject[] => [
  { path: "services", element: <ServiceCatalog detailBase={base + "/services"} showSignInHint={guest} /> },
  { path: "services/:id", element: <ServiceDetail backTo={base + "/services"} /> },
];

export default function AppRoutes() {
  return useRoutes([
    { path: "/login", element: <LoginPage /> },
    {
      path: "/admin",
      element: <RequireRole role="admin"><Layout role="admin" /></RequireRole>,
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
        // [new-page:admin]
        notFound,
      ],
    },
    {
      path: "/staff",
      element: <RequireRole role="staff"><Layout role="staff" /></RequireRole>,
      children: [
        { index: true, element: <StaffDashboardPage /> },
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
