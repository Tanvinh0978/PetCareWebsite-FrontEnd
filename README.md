# PetCare Frontend

Giao diện React (Vite + TypeScript) cho backend `PetCareBooking` (.NET 8).

## Chạy thử

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Chạy backend bằng profile `https` (`https://localhost:7287`). Vite proxy `/api` sang địa chỉ này (xem `vite.config.ts`).

## Kết nối API

Phần Services đã nối API thật: danh sách có phân trang, xem chi tiết, thêm, sửa, xóa mềm. Thêm và sửa là **màn riêng** (`/admin/services/new`, `/admin/services/:id/edit`), không dùng popup. Các phần khác đang là trang trống.

## Cấu trúc

```
src/
  pages/          mỗi vai trò một thư mục
    admin/        DashboardPage, service/ (List, Form, Detail)
    staff/        StaffDashboardPage
    customer/     HomePage (guest dùng chung)
    auth/         LoginPage
    errors/       NotFoundPage
  components/     Layout và component dùng chung (service/ServiceCatalog, ServiceDetail)
  api/            client axios và hàm gọi API (serviceApi.ts, ...)
  routes/         index.tsx (toàn bộ route), nav.ts (menu theo vai trò)
  auth/           roles, AuthContext, RequireRole
  types/          kiểu dữ liệu (api.ts, service.ts, ...)
```

Import dùng alias `@/` trỏ tới `src/` (ví dụ `@/api/client`). Xem `CONTRIBUTING.md` để thêm màn hình mới:

```bash
npm run new:page -- admin pets Pet
```
