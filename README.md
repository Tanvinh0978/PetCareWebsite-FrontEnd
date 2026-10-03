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

Feature Dịch vụ đã nối API thật: tìm kiếm có phân trang (`GET /api/services/admin/search`), xem chi tiết, thêm, sửa, xóa mềm. Cần chạy backend bằng profile `https` và đã `dotnet ef database update`. Các feature khác đang là trang trống.

## Cấu trúc

Chia theo feature (mỗi model một thư mục). Xem `CONTRIBUTING.md` để biết cách thêm chức năng mới:

```bash
npm run new:feature -- pets Pet
```

```
src/
  features/   services/ (mẫu), ... mỗi feature có types, api, pages, index
  shared/     client axios, ApiResponse, Layout
  pages/      Home, NotFound
```

## Bước tiếp theo gợi ý

Backend đã có entity Customer, Pet, Booking, Room, Promotion, Review nhưng chưa có endpoint. Khi có, thêm lần lượt: đăng nhập, quản lý thú cưng, luồng đặt lịch.
