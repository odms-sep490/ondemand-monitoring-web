# Mock API

Lớp giả lập backend dùng khi chưa có API thật, hoặc khi API thật chưa xong endpoint đang cần.

## Bật / tắt

Đặt biến môi trường `VITE_USE_MOCK_API` trong `.env` (copy từ `.env.example`):

- `VITE_USE_MOCK_API=true` → luôn dùng mock.
- `VITE_USE_MOCK_API=false` → luôn gọi backend thật (`authenticatedFetch`).
- Không đặt → mặc định bật khi chạy `npm run dev` (dev mode), tắt khi build production.

Xem `src/config/env.ts` (`env.useMockApi`).

## Dữ liệu mẫu ở đâu

- `src/mocks/data/*.json` — một file JSON cho mỗi resource, tên trường camelCase theo DTO backend, 2-space indent. Component không bao giờ import JSON trực tiếp.
- `src/mocks/db.ts` — `createCollection(seedJson)` deep-clone JSON thành state trong bộ nhớ để mock có thể ghi/sửa trong phiên làm việc; `resetMockDb()` khôi phục lại toàn bộ collection về đúng dữ liệu seed (dùng trong test).

## Cách thêm một route mock

1. Thêm/​sửa file JSON dữ liệu trong `src/mocks/data/`.
2. Tạo handler trong `src/mocks/handlers/<feature>.ts`:

   ```ts
   import { createCollection } from '../db'
   import { ok, registerMockRoutes } from '../mockServer'
   import ordersSeed from '../data/orders.json'

   const orders = createCollection(ordersSeed)

   registerMockRoutes([
     {
       method: 'GET',
       path: '/api/orders/:id',
       handler: ({ params }) => {
         const order = orders.find((o) => o.id === params.id)
         if (!order) return fail(404, 'NOT_FOUND', 'Order not found')
         return ok(order)
       },
     },
   ])
   ```

3. Import handler module một lần trong `src/mocks/index.ts` (ví dụ `import './handlers/orders'`).

Route không khớp handler nào sẽ đi thẳng ra `fetch` thật (pass-through), nên có thể mock từng endpoint một mà không chặn các endpoint chưa mock.

## Envelope

Mọi response mock đều đúng format `ApiResponse` của backend: `{ success, code, message, data, errors, timestamp }`. Dùng `ok()`, `created()`, `fail()` trong `mockServer.ts` để dựng envelope, không tự viết tay.

## Hybrid mode: vài route gọi backend thật

Khi `VITE_USE_MOCK_API=true`, có thể cho một số endpoint đã có ở backend đi thẳng tới API thật (kèm token qua `authenticatedFetch`), phần còn lại vẫn dùng mock. Khai báo trong `.env`:

```
VITE_USE_MOCK_API=true
VITE_REAL_API_ROUTES=GET /api/admin/users*,PATCH /api/admin/users/*/status,POST /api/admin/accounts,GET /api/services*,POST /api/services,PUT /api/services/*,DELETE /api/services/*,GET /api/preferred-times*,POST /api/preferred-times,PUT /api/preferred-times/*,DELETE /api/preferred-times/*,GET /api/services/pricing-estimate,GET /api/service-deliverables*,GET /api/category-services*,GET /api/zones,POST /api/orders,GET /api/orders/mine,GET /api/orders/*,GET /api/customer/mission-history*,GET /api/customer/available-media,GET /api/customer/media-notifications,GET /api/customer/missions/*/media,GET /api/customer/missions/*/media/*,GET /api/customer/missions/*/media-status,GET /api/media/*/download
```

- Danh sách phân tách bằng dấu phẩy, mỗi mục là `METHOD /path`.
- `*` ở giữa khớp đúng một segment (`/api/admin/users/*/status`); `*` ở cuối khớp mọi phần đuôi (`/api/admin/users*` gồm cả `/api/admin/users/123` và query).
- Route không khớp → mock. Bỏ trống → toàn bộ đi mock.
- Logic khớp nằm ở `src/shared/api/realApiRoutes.ts`; các route trên vẫn có handler mock (dạng DTO của BE) để test chạy offline.
