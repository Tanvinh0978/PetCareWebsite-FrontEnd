import { useRoutes, type RouteObject } from "react-router-dom";
import Layout from "@/components/Layout";
import RequireRole, { GuestOnly } from "@/auth/RequireRole";
import RequirePermission from "@/auth/RequirePermission";
import { PERMISSIONS } from "@/auth/permissionHelper";
import ServiceCatalog from "@/components/service/ServiceCatalog";
import ServiceDetail from "@/components/service/ServiceDetail";
import RoomTypeCatalog from "@/components/roomType/RoomTypeCatalog";
import RoomTypeDetail from "@/components/roomType/RoomTypeDetail";
import CustomerDetail from "@/components/customer/CustomerDetail";
import PetDetail from "@/components/pet/PetDetail";
import StaffDetail from "@/components/staff/StaffDetail";
import VoucherDetail from "@/components/voucher/VoucherDetail";
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
import RolePermissionPage from "@/pages/admin/role/RolePermissionPage";
import AdminVoucherListPage from "@/pages/admin/voucher/VoucherListPage";
import AdminVoucherFormPage from "@/pages/admin/voucher/VoucherFormPage";
import CreateBookingPage from "@/pages/customer/CreateBookingPage";
import MyPetsPage from "@/pages/customer/MyPetsPage";
import PetFormPage from "@/pages/customer/PetFormPage";
import MyBookingsPage from "@/pages/customer/MyBookingsPage";
import CustomerBookingDetailPage from "@/pages/customer/booking/CustomerBookingDetailPage";
import CustomerProfilePage from "@/pages/customer/CustomerProfilePage";
import ReviewManagementPage from "@/pages/admin/review/ReviewManagementPage";
import PaymentResultPage from "@/pages/customer/PaymentResultPage";
import StaffProfilePage from "@/pages/staff/StaffProfilePage";
import GroomingTasksPage from "@/pages/staff/grooming/GroomingTasksPage";
import BookingManagementPage from "@/pages/admin/booking/BookingManagementPage";
import BoardingTasksPage from "@/pages/staff/boarding/BoardingTasksPage";
import CounterBookingPage from "@/pages/staff/CounterBookingPage";

const notFound: RouteObject = { path: "*", element: <NotFoundPage /> };

// Danh sách màn hình dùng chung cho guest (gốc "/") và customer ("/customer").
const publicServiceRoutes = (base: string, guest = false): RouteObject[] => [
  { path: "services", element: <ServiceCatalog detailBase={base + "/services"} showSignInHint={guest} /> },
  { path: "services/:id", element: <ServiceDetail backTo={base + "/services"} /> },
];

const publicRoomTypeRoutes = (base: string, guest = false): RouteObject[] => [
  { path: "room-types", element: <RoomTypeCatalog detailBase={base + "/room-types"} showSignInHint={guest} /> },
  { path: "room-types/:id", element: <RoomTypeDetail backTo={base + "/room-types"} guest={guest} /> },
];

export default function AppRoutes() {
  return useRoutes([
    { path: "/login", element: <PawstayAuthPage /> },
    { path: "/register", element: <PawstayAuthPage /> },
    { path: "/verify-otp", element: <PawstayAuthPage /> },
    { path: "/forgot-password", element: <PawstayAuthPage /> },
    { path: "/reset-password", element: <PawstayAuthPage /> },
    { path: "/payment-result", element: <PaymentResultPage /> },
    {
      path: "/admin",
      element: <RequireRole role="admin"><Layout role="admin" /></RequireRole>,
      children: [
        { index: true, element: <AdminDashboardPage /> },
        { path: "services", element: <AdminServiceListPage /> },
        { path: "services/new", element: <AdminServiceFormPage /> },
        { path: "services/:id", element: <ServiceDetail backTo="/admin/services" editTo={(id) => `/admin/services/${id}/edit`} /> },
        { path: "services/:id/edit", element: <AdminServiceFormPage /> },
        { path: "customers", element: <AdminCustomerListPage /> },
        { path: "customers/new", element: <AdminCustomerFormPage /> },
        { path: "customers/:id", element: <CustomerDetail backTo="/admin/customers" editTo={(id) => `/admin/customers/${id}/edit`} /> },
        { path: "customers/:id/edit", element: <AdminCustomerFormPage /> },
        { path: "room-types", element: <AdminRoomTypeListPage /> },
        { path: "room-types/new", element: <AdminRoomTypeFormPage /> },
        { path: "room-types/:id/edit", element: <AdminRoomTypeFormPage /> },
        { path: "rooms", element: <AdminRoomListPage /> },
        { path: "rooms/new", element: <AdminRoomFormPage /> },
        { path: "rooms/:id/edit", element: <AdminRoomFormPage /> },
        { path: "pets", element: <AdminPetListPage /> },
        { path: "pets/new", element: <AdminPetFormPage /> },
        { path: "pets/:id", element: <PetDetail backTo="/admin/pets" editTo={(id) => `/admin/pets/${id}/edit`} /> },
        { path: "pets/:id/edit", element: <AdminPetFormPage /> },
        { path: "staff", element: <AdminStaffListPage /> },
        { path: "staff/new", element: <AdminStaffFormPage /> },
        { path: "staff/:id", element: <StaffDetail backTo="/admin/staff" editTo={(id) => `/admin/staff/${id}/edit`} /> },
        { path: "staff/:id/edit", element: <AdminStaffFormPage /> },
        { path: "roles", element: <RolePermissionPage /> },
        { path: "vouchers", element: <AdminVoucherListPage /> },
        { path: "vouchers/new", element: <AdminVoucherFormPage /> },
        { path: "vouchers/:id", element: <VoucherDetail backTo="/admin/vouchers" editTo={(id) => `/admin/vouchers/${id}/edit`} /> },
        { path: "vouchers/:id/edit", element: <AdminVoucherFormPage /> },
        { path: "reviews", element: <ReviewManagementPage /> },
        { path: "bookings", element: <BookingManagementPage /> },
        { path: "bookings/new", element: <CounterBookingPage /> },
        { path: "grooming-tasks", element: <GroomingTasksPage /> },
        { path: "boarding-tasks", element: <BoardingTasksPage /> },
        { path: "manage-boarding", element: <BoardingTasksPage /> },
        notFound,
      ],
    },
    {
      path: "/staff",
      element: <RequireRole role="staff"><Layout role="staff" /></RequireRole>,
      children: [
        { index: true, element: <RequirePermission permission={PERMISSIONS.DASHBOARD_VIEW}><StaffDashboardPage /></RequirePermission> },
        { path: "bookings", element: <RequirePermission permission={PERMISSIONS.BOOKING_VIEW}><BookingManagementPage /></RequirePermission> },
        { path: "bookings/new", element: <RequirePermission permission={PERMISSIONS.BOOKING_CREATE}><CounterBookingPage /></RequirePermission> },
        { path: "grooming-tasks", element: <RequirePermission permission={PERMISSIONS.GROOMING_TASK_VIEW}><GroomingTasksPage /></RequirePermission> },
        { path: "boarding-tasks", element: <RequirePermission permission={[PERMISSIONS.CARE_RECORD_VIEW, PERMISSIONS.ROOM_VIEW]}><BoardingTasksPage /></RequirePermission> },
        { path: "manage-boarding", element: <RequirePermission permission={[PERMISSIONS.CARE_RECORD_VIEW, PERMISSIONS.ROOM_VIEW]}><BoardingTasksPage /></RequirePermission> },
        { path: "services", element: <RequirePermission permission={PERMISSIONS.SERVICE_VIEW}><AdminServiceListPage /></RequirePermission> },
        { path: "services/new", element: <RequirePermission permission={PERMISSIONS.SERVICE_MANAGE}><AdminServiceFormPage /></RequirePermission> },
        { path: "services/:id", element: <RequirePermission permission={PERMISSIONS.SERVICE_VIEW}><ServiceDetail backTo="/staff/services" editTo={(id) => `/staff/services/${id}/edit`} /></RequirePermission> },
        { path: "services/:id/edit", element: <RequirePermission permission={PERMISSIONS.SERVICE_MANAGE}><AdminServiceFormPage /></RequirePermission> },
        { path: "customers", element: <RequirePermission permission={PERMISSIONS.CUSTOMER_VIEW}><AdminCustomerListPage /></RequirePermission> },
        { path: "customers/new", element: <RequirePermission permission={PERMISSIONS.CUSTOMER_MANAGE}><AdminCustomerFormPage /></RequirePermission> },
        { path: "customers/:id", element: <RequirePermission permission={PERMISSIONS.CUSTOMER_VIEW}><CustomerDetail backTo="/staff/customers" editTo={(id) => `/staff/customers/${id}/edit`} /></RequirePermission> },
        { path: "customers/:id/edit", element: <RequirePermission permission={PERMISSIONS.CUSTOMER_MANAGE}><AdminCustomerFormPage /></RequirePermission> },
        { path: "room-types", element: <RequirePermission permission={PERMISSIONS.ROOM_VIEW}><AdminRoomTypeListPage /></RequirePermission> },
        { path: "room-types/new", element: <RequirePermission permission={PERMISSIONS.ROOM_MANAGE}><AdminRoomTypeFormPage /></RequirePermission> },
        { path: "room-types/:id/edit", element: <RequirePermission permission={PERMISSIONS.ROOM_MANAGE}><AdminRoomTypeFormPage /></RequirePermission> },
        { path: "rooms", element: <RequirePermission permission={PERMISSIONS.ROOM_VIEW}><AdminRoomListPage /></RequirePermission> },
        { path: "rooms/new", element: <RequirePermission permission={PERMISSIONS.ROOM_MANAGE}><AdminRoomFormPage /></RequirePermission> },
        { path: "rooms/:id/edit", element: <RequirePermission permission={PERMISSIONS.ROOM_MANAGE}><AdminRoomFormPage /></RequirePermission> },
        { path: "pets", element: <RequirePermission permission={PERMISSIONS.PET_VIEW}><StaffPetListPage /></RequirePermission> },
        { path: "pets/new", element: <RequirePermission permission={PERMISSIONS.PET_MANAGE}><StaffPetFormPage /></RequirePermission> },
        { path: "pets/:id", element: <RequirePermission permission={PERMISSIONS.PET_VIEW}><PetDetail backTo="/staff/pets" editTo={(id) => `/staff/pets/${id}/edit`} /></RequirePermission> },
        { path: "pets/:id/edit", element: <RequirePermission permission={PERMISSIONS.PET_MANAGE}><StaffPetFormPage /></RequirePermission> },
        { path: "reviews", element: <ReviewManagementPage /> },
        { path: "staff", element: <RequirePermission permission={PERMISSIONS.STAFF_VIEW}><AdminStaffListPage /></RequirePermission> },
        { path: "staff/new", element: <RequirePermission permission={PERMISSIONS.STAFF_MANAGE}><AdminStaffFormPage /></RequirePermission> },
        { path: "staff/:id", element: <RequirePermission permission={PERMISSIONS.STAFF_VIEW}><StaffDetail backTo="/staff/staff" editTo={(id) => `/staff/staff/${id}/edit`} /></RequirePermission> },
        { path: "staff/:id/edit", element: <RequirePermission permission={PERMISSIONS.STAFF_MANAGE}><AdminStaffFormPage /></RequirePermission> },
        { path: "roles", element: <RequirePermission permission={PERMISSIONS.ROLE_VIEW}><RolePermissionPage /></RequirePermission> },
        { path: "vouchers", element: <RequirePermission permission={PERMISSIONS.VOUCHER_VIEW}><AdminVoucherListPage /></RequirePermission> },
        { path: "vouchers/new", element: <RequirePermission permission={PERMISSIONS.VOUCHER_MANAGE}><AdminVoucherFormPage /></RequirePermission> },
        { path: "vouchers/:id", element: <RequirePermission permission={PERMISSIONS.VOUCHER_VIEW}><VoucherDetail backTo="/staff/vouchers" editTo={(id) => `/staff/vouchers/${id}/edit`} /></RequirePermission> },
        { path: "vouchers/:id/edit", element: <RequirePermission permission={PERMISSIONS.VOUCHER_MANAGE}><AdminVoucherFormPage /></RequirePermission> },
        { path: "profile", element: <StaffProfilePage /> },
        notFound,
      ],
    },
    {
      path: "/customer",
      element: <RequireRole role="customer"><Layout role="customer" /></RequireRole>,
      children: [
        { index: true, element: <HomePage /> },
        ...publicServiceRoutes("/customer"),
        ...publicRoomTypeRoutes("/customer"),
        { path: "pets", element: <MyPetsPage /> },
        { path: "pets/new", element: <PetFormPage /> },
        { path: "pets/:id", element: <PetDetail backTo="/customer/pets" editTo={(id) => `/customer/pets/${id}/edit`} /> },
        { path: "pets/:id/edit", element: <PetFormPage /> },
        { path: "booking", element: <CreateBookingPage /> },
        { path: "bookings", element: <MyBookingsPage /> },
        { path: "bookings/:id", element: <CustomerBookingDetailPage /> },
        { path: "payment-result", element: <PaymentResultPage /> },
        { path: "profile", element: <CustomerProfilePage /> },
        notFound,
      ],
    },
    {
      path: "/",
      element: <GuestOnly><Layout role="guest" /></GuestOnly>,
      children: [
        { index: true, element: <HomePage /> },
        ...publicServiceRoutes("", true),
        ...publicRoomTypeRoutes("", true),
        notFound,
      ],
    },
  ]);
}
