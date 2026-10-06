# PetCare Frontend

Giao diện React (Vite + TypeScript) cho backend `PetCareBooking` (.NET 8).

## Chạy thử

```bash
npm install
npm run dev          # http://localhost:5173
```

Chạy backend bằng profile `https` (`https://localhost:7287`). Vite proxy `/api` sang địa chỉ này (xem `vite.config.ts`). Cần backend đã `dotnet ef database update`.

Backend chưa có API đăng nhập: vào `/login` và chọn Customer hoặc Admin để xem thử các màn.

## Kiến trúc

Bám theo dự án mẫu (Ant Design + ProComponents + Zustand + React Router). Xem `CONTRIBUTING.md` để biết cấu trúc thư mục, phân quyền và cách thêm một thực thể mới.

## Trạng thái

| Màn | Vai trò | API |
|---|---|---|
| Danh sách, chi tiết dịch vụ | guest, customer | `GET /api/services`, `GET /api/services/{id}` |
| Quản lý dịch vụ (tìm, lọc, thêm, sửa, xóa) | admin | `GET /api/services/admin`, `POST`, `PUT`, `DELETE` |

Lọc và phân trang của admin làm ở frontend vì `GET /api/services/admin/search` của backend đang trả 500 khi bộ lọc để trống.
