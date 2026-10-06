# Hướng dẫn làm việc trong repo

Kiến trúc bám theo dự án mẫu `djnd-cinema-react-ts`: React 19 + TypeScript + Vite, Ant Design 5 + ProComponents, Zustand, React Router 7. Thư mục chia theo **loại file**, trang chia theo **vai trò**.

## Cấu trúc

```
src/
  main.tsx, App.tsx          ConfigProvider (theme), AntdApp, ProConfigProvider, BrowserRouter
  routes/app.route.tsx       MỌI route của ứng dụng nằm ở đây
  components/                component dùng chung (protected.route.tsx, ...)
  layouts/                   admin.layout.tsx (ProLayout + menu), auth.layout.tsx
  pages/
    admin/<thực thể>/        màn của admin: <thực thể>.management.tsx (ProTable), <thực thể>.detail.tsx, components/ (modal)
    user/                    màn của guest và customer: layout.tsx, header.tsx, footer.tsx, home/, services/
    auth/                    Login
    errors/                  forbidden (403), not.found (404)
  services/                  axiosClient.ts và <thực thể>.service.ts (mỗi file một object gọi API)
  store/useAuthStore.ts      Zustand: isAuthenticated, user, accessToken, role (lưu localStorage)
  types/                     <thực thể>.types.ts (DTO, enum, nhãn) và backend.d.ts (kiểu toàn cục)
  utils/                     apiError, format, roles
  styles/theme.ts            theme Ant Design
```

## Vai trò và quyền

| Vai trò | Khu vực | Cách bảo vệ |
|---|---|---|
| guest (chưa đăng nhập) | `/`, `/services`... dùng `pages/user` | không cần |
| customer (`ROLE_CUSTOMER`) | cùng khu vực user, thêm các route riêng | `ProtectedRoute requiredRole` |
| admin (`ROLE_ADMIN`) | `/admin/...` dùng `AdminLayout` | `ProtectedRoute requiredRole` |

`ProtectedRoute`: chưa đăng nhập thì về `/login`, sai vai trò thì về `/403`. Backend chưa có API đăng nhập, nên `pages/auth/Login.tsx` hiện chỉ cho chọn vai trò để xem thử. Khi có API, thêm `auth.service.ts` (như dự án mẫu), gọi `setAuth(token, user)` và bổ sung xử lý 401 trong `axiosClient.ts`.

## Thêm một thực thể mới (ví dụ Pet), theo thứ tự

1. `types/pet.types.ts`: DTO và enum, khớp backend. Enum dùng `as const`, không dùng `enum`.
2. `services/pet.service.ts`: object `petService`, mỗi hàm một endpoint, có kiểu `IBackendRes<...>` (xem `service.service.ts`).
3. `pages/admin/pet/pet.management.tsx` (ProTable), kèm `pet.detail.tsx` và `components/pet.form.modal.tsx` nếu cần. Màn cho customer đặt trong `pages/user/...`.
4. Đăng ký route trong `routes/app.route.tsx`: route admin trong nhóm `ProtectedRoute requiredRole={ROLE.ADMIN}`, route customer trong nhóm customer.
5. Thêm mục menu admin trong `layouts/admin.layout.tsx` (mảng `menuRoutes`), hoặc mục menu user trong `pages/user/header.tsx`.

## Quy ước

- Import dùng alias `@/` (ví dụ `@/services/service.service`).
- Chữ hiển thị trên giao diện (nhãn, nút, thông báo) dùng tiếng Anh, URL tiếng Anh.
- Trang không gọi axios trực tiếp, chỉ gọi hàm trong `services/`. Lỗi hiển thị bằng `getApiErrorMessage(err)`.
- Thông báo dùng `App.useApp()` của Ant Design (`message`, `notification`).
- Backend trả `{ isSuccess, statusCode, message, result }`, kiểu `IBackendRes<T>`. Danh sách phân trang là `IPagedResult<T>`.
- Frontend không sửa được backend: nếu endpoint lỗi, xử lý tạm trong `services/` kèm chú thích lý do (xem `fetchAllForAdmin`).
- Chạy `npm run build` và `npm run lint` trước khi mở Pull Request.

## Quy trình git gợi ý

```bash
git checkout -b feature/pets
git add -A && git commit -m "Add pets screens"
git push -u origin feature/pets     # rồi mở Pull Request vào main
```
