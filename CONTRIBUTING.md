# Hướng dẫn thêm chức năng (feature) mới

Code chia theo **feature**, mỗi feature tương ứng một model của backend. Mọi thứ của model đó nằm trong một thư mục, nên mỗi người làm một feature sẽ ít đụng file của nhau.

```
src/
  features/
    services/            <- mẫu hoàn chỉnh, xem để làm theo
      types.ts           kiểu dữ liệu và enum của model
      api.ts             các hàm gọi API của model
      pages/             các màn hình (ServiceListPage, ServiceFormPage)
      index.tsx          khai báo route và menu của feature
    index.ts             danh sách feature (tự động ghép route và menu)
  shared/                dùng chung nhiều feature
    api/client.ts        axios và getErrorMessage
    types/api.ts         ApiResponse<T>
    types/feature.ts     kiểu Feature
    components/Layout.tsx   khung trang có sidebar
  pages/                 trang không thuộc model nào (Home, NotFound)
  App.tsx                ghép route, thường không cần sửa
```

## Tạo feature mới bằng 1 lệnh

```bash
npm run new:feature -- pets Pet
```

- `pets`: tên thư mục và đường dẫn URL (chữ thường, có thể có dấu `-`).
- `Pet`: tên entity, viết hoa chữ đầu (PascalCase).

Lệnh tạo `src/features/pets/` gồm `types.ts`, `api.ts`, `pages/PetListPage.tsx`, `index.tsx` và tự đăng ký vào `src/features/index.ts`. Chạy `npm run dev` rồi mở `/pets` là thấy trang. Sau đó bạn làm theo thứ tự:

1. `types.ts`: khai báo trường theo entity backend (đối chiếu `PetCareBooking.Domain/Entities`). Enum ở backend là chuỗi, ví dụ `'Dog' | 'Cat'`.
2. `api.ts`: sửa đường dẫn cho khớp controller và thêm hàm create, update, delete.
3. `pages/`: làm giao diện. Thêm trang mới thì thêm vào mảng `routes` trong `index.tsx` của feature.
4. `index.tsx`: đặt lại `label` của menu bằng tiếng Việt, và `path` nếu muốn URL tiếng Việt như `dich-vu`.

## Sidebar và các trang trống có sẵn

Sidebar tự lấy mục menu từ `nav` trong `index.tsx` của từng feature, thứ tự theo `src/features/index.ts`. Các feature `staff`, `customers`, `pets`, `bookings`, `rooms`, `promotions`, `reviews`, `profile` đã có trang trống (chỉ có tiêu đề) để bấm từ sidebar. Khi bắt đầu làm một feature có sẵn, chạy lại lệnh tạo feature để thêm `types.ts` và `api.ts`. Lệnh không ghi đè file đã có:

```bash
npm run new:feature -- pets Pet
```

Sau đó sửa trang trong `pages/` theo nhu cầu.

## Quy ước

- Trang chỉ gọi hàm trong `api.ts` của feature, không gọi axios trực tiếp.
- Chỉ đưa vào `shared/` thứ được từ 2 feature trở lên dùng. Feature này không import trực tiếp từ feature khác, nếu cần dùng chung thì chuyển lên `shared/`.
- Tên file trang: `<Entity>ListPage`, `<Entity>FormPage`, `<Entity>DetailPage`.
- Backend trả `ApiResponse<T>` (`isSuccess`, `statusCode`, `message`, `result`). Dùng `getErrorMessage(err)` để hiện lỗi.
- Backend chưa có endpoint thì làm dữ liệu mẫu trong `api.ts` giống `features/services/api.ts` (cờ `VITE_USE_MOCK`).

## Gợi ý phân công theo entity backend

| Feature | Entity | Lệnh tạo |
|---|---|---|
| Thú cưng | Pet | `npm run new:feature -- pets Pet` |
| Đặt lịch | Booking, BookingItem | `npm run new:feature -- bookings Booking` |
| Phòng | Room, RoomType | `npm run new:feature -- rooms Room` |
| Khuyến mãi | Promotion | `npm run new:feature -- promotions Promotion` |
| Đánh giá | Review | `npm run new:feature -- reviews Review` |
| Khách hàng | Customer | `npm run new:feature -- customers Customer` |
| Nhân viên | Staff | `npm run new:feature -- staff Staff` |

## Quy trình git gợi ý

```bash
git checkout -b feature/pets
# làm việc, rồi:
git add -A && git commit -m "Add pets feature"
git push -u origin feature/pets     # sau đó mở Pull Request vào main
```
