# PetCare Frontend

Giao diện React (Vite + TypeScript) cho backend `PetCareBooking` (.NET 8).

## Chạy thử

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
```

Chạy backend bằng profile `https` (`https://localhost:7287`). Vite proxy `/api` sang địa chỉ này (xem `vite.config.ts`).

## Trạng thái kết nối API

| Chức năng | Endpoint | Trạng thái |
|---|---|---|
| Thêm dịch vụ | `POST /api/services` | Đã nối API thật |
| Danh sách dịch vụ | `GET /api/services` | Backend chưa có (code đang bị comment), dùng dữ liệu mẫu |

Khi backend có `GET /api/services`, đặt `VITE_USE_MOCK=false` trong `.env`. Hình dạng dữ liệu mong đợi nằm ở `src/types/index.ts` (`Service`); nếu DTO backend khác, sửa tại `src/api/services.ts`.

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
