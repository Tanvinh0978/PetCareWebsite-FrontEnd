# Hướng dẫn thêm màn hình mới

Code chia theo **vai trò**: mỗi vai trò một thư mục trong `src/pages/`.

## Vai trò và khu vực

| Vai trò | URL | Thư mục |
|---|---|---|
| guest | `/` | dùng lại `pages/customer` và `components/` |
| customer | `/customer/...` | `src/pages/customer/` |
| staff | `/staff/...` | `src/pages/staff/` |
| admin | `/admin/...` | `src/pages/admin/` |

Backend chưa có API đăng nhập, nên `/login` hiện chỉ cho chọn vai trò để xem thử (`src/auth/AuthContext.tsx`). Khi có API thật, chỉ cần sửa file này. `RequireRole` chặn truy cập sai khu vực.

## Quy tắc đặt file

- Trang của vai trò nào nằm trong `pages/<vai trò>/<tên nhóm>/`.
- Thứ gì nhiều trang dùng thì để ở `components/`, `types/` hoặc `api/`.
- Thứ gì chỉ một trang dùng thì để cạnh trang đó.
- Hàm gọi API nằm trong `src/api/<tên>Api.ts`. Trang không gọi axios trực tiếp.
- Toàn bộ route khai báo trong `src/routes/index.tsx`, menu trong `src/routes/nav.ts`.

## Thêm / sửa dữ liệu

Không dùng popup. Mỗi nhóm có 3 route riêng, ví dụ:

```
/admin/services              danh sách
/admin/services/new          màn Add
/admin/services/:id/edit     màn Edit
```

Một `ServiceFormPage` dùng chung cho Add và Edit (có `:id` thì là Edit). Lưu xong thì quay về danh sách. Xem `src/pages/admin/service/` làm mẫu.

## Tạo nhóm màn hình mới

```bash
npm run new:page -- admin pets Pet
```

- Tham số: vai trò (`admin`, `staff`, `customer`), tên thư mục và URL, tên entity.
- Lệnh tạo `types/pets.ts`, `api/petsApi.ts`, `pages/admin/pets/PetListPage.tsx`, rồi tự thêm route và menu. File đã có sẽ không bị ghi đè.
- Sau đó sửa `types`, đường dẫn trong `api` cho khớp controller, rồi làm giao diện.

## Quy ước

- Mọi chữ hiển thị trên giao diện dùng tiếng Anh, URL cũng tiếng Anh.
- Backend trả `ApiResponse<T>` (`isSuccess`, `statusCode`, `message`, `result`). Dùng `getErrorMessage(err)` để hiện lỗi.
- Frontend không sửa được backend: nếu endpoint lỗi, xử lý tạm trong `api/` kèm chú thích lý do (xem `searchServices`).

## Quy trình git gợi ý

```bash
git checkout -b feature/pets
git add -A && git commit -m "Add pets page"
git push -u origin feature/pets     # rồi mở Pull Request vào main
```
