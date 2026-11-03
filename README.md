# MakeFlow Frontend

Frontend React/Vite/TypeScript cho nền tảng quản lý sản xuất, kho và POS. Codebase dùng cấu trúc feature-first, Redux Toolkit + RTK Query theo nguyên tắc tổ chức của frontend Sapo, nhưng giữ một ứng dụng duy nhất để phù hợp quy mô hiện tại.

## Chạy nhanh không cần backend

```powershell
pnpm.cmd install
pnpm.cmd dev:mock
```

Mở `http://localhost:5173`, đăng nhập bằng tài khoản được điền sẵn:

- Email: `owner@makeflow.local`
- Mật khẩu: `demo123`

Ở thanh trên cùng, chọn các kịch bản mock `Thành công`, `Rỗng`, `Lỗi 500`, `Cấm 403` hoặc `Xung đột 409` để kiểm tra trạng thái màn hình.

## Chạy với backend

```powershell
Copy-Item .env.example .env.local
pnpm.cmd dev
```

Vite proxy `/api` sang `http://localhost:8080`. Có thể đổi `VITE_API_BASE_URL` nếu backend chạy ở gateway khác.

## Quality gate

```powershell
pnpm.cmd check
```

Lệnh này chạy lint, TypeScript, test và production build.

## Kiến trúc

```text
src/
├── app/          # Store, base API, provider, error boundary
├── features/     # Module nghiệp vụ tự sở hữu API, page và route
├── layouts/      # App shell và navigation
├── mocks/        # MSW fixtures/handlers cùng contract /api/v1
├── routes/       # Composition, auth và permission guard
└── shared/       # UI primitives, decimal, HTTP và type dùng chung
```

Không đặt logic nghiệp vụ authoritative trong FE. Giá vốn, tồn kho, quyền và tenant phải do backend xác nhận.
