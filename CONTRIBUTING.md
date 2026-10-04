# Hướng dẫn thêm chức năng (feature) mới

Code chia theo **feature** (mỗi model của backend một thư mục), và trong mỗi feature các màn hình chia theo **vai trò**.

## Vai trò và khu vực

| Vai trò | URL | Ghi chú |
|---|---|---|
| guest | `/` | Chưa đăng nhập, chỉ xem. Người đã đăng nhập vào `/` sẽ được chuyển về khu vực của họ |
| customer | `/customer/...` | Chỉ customer vào được |
| admin | `/admin/...` | Chỉ admin vào được |

Backend chưa có API đăng nhập, nên `/login` hiện chỉ cho chọn vai trò để xem thử (`src/shared/auth/AuthContext.tsx`). Khi có API thật, chỉ cần sửa file này. `RequireRole` đã chặn truy cập sai khu vực.

## Cấu trúc

```
src/
  features/
    services/                 <- feature mẫu hoàn chỉnh
      types.ts                kiểu dữ liệu và enum
      api.ts                  hàm gọi API
      components/             phần giao diện dùng chung giữa các vai trò
      pages/
        admin/                màn của admin
        customer/             màn của customer
        guest/                màn của guest
      index.tsx               khai báo route và menu cho từng vai trò
    index.ts                  danh sách feature
  shared/
    auth/                     roles, AuthContext, RequireRole
    api/client.ts             axios và getErrorMessage
    components/Layout.tsx     khung có sidebar theo vai trò
  pages/                      Home, Dashboard, Login, NotFound
```

## Tạo feature mới

```bash
npm run new:feature -- pets Pet customer,admin
```

- `pets`: tên thư mục và URL, `Pet`: tên entity, `customer,admin`: các vai trò có màn hình (guest, customer, admin; mặc định chỉ admin).
- Lệnh tạo `types.ts`, `api.ts`, `pages/<vai trò>/PetListPage.tsx`, `index.tsx` và tự đăng ký vào `src/features/index.ts`. File đã có sẽ không bị ghi đè.
- Trong `index.tsx`, `routes` và `nav` khai báo theo từng vai trò. Mục menu hiện ở sidebar của vai trò đó.

Sau đó làm lần lượt: `types.ts` (đối chiếu entity backend), `api.ts` (đường dẫn khớp controller), rồi giao diện trong `pages/<vai trò>/`. Phần giao diện giống nhau giữa các vai trò thì đưa vào `components/` và truyền props (xem `ServiceCatalog`, `ServiceDetail`).

## Quy ước

- Mọi chữ hiển thị trên giao diện (nhãn, nút, thông báo) dùng tiếng Anh, URL cũng tiếng Anh.
- Trang chỉ gọi hàm trong `api.ts` của feature, không gọi axios trực tiếp.
- Chỉ đưa vào `shared/` thứ được từ 2 feature trở lên dùng. Feature này không import trực tiếp từ feature khác.
- Backend trả `ApiResponse<T>` (`isSuccess`, `statusCode`, `message`, `result`). Dùng `getErrorMessage(err)` để hiện lỗi.
- Frontend không sửa được backend: nếu endpoint lỗi, xử lý tạm ở `api.ts` kèm chú thích lý do (xem `searchServices`).

## Quy trình git gợi ý

```bash
git checkout -b feature/pets
git add -A && git commit -m "Add pets feature"
git push -u origin feature/pets     # rồi mở Pull Request vào main
```
