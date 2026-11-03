# Hướng dẫn nối MakeFlow Backend

## Nguyên tắc

1. Giữ nguyên đường dẫn `/api/v1` giữa mock và backend thật.
2. Mỗi module chỉ sửa `features/<module>/api.ts` khi contract backend thay đổi.
3. Không gọi `fetch` hoặc Axios trực tiếp trong page/component.
4. Backend lấy workspace/tenant từ principal tin cậy, FE không gửi `tenant_id` để phân quyền.
5. Trình duyệt dùng HttpOnly session cookie; mutation gửi CSRF header nếu có `XSRF-TOKEN`.
6. Command nhạy cảm như checkout phải gửi `Idempotency-Key`.

## Error contract

UI đọc RFC ProblemDetail và các extension ổn định:

```json
{
  "title": "Không đủ tồn kho",
  "status": 409,
  "detail": "Sản phẩm vừa được bán ở quầy khác.",
  "code": "INSUFFICIENT_STOCK",
  "correlation_id": "019a..."
}
```

Các mã HTTP được ánh xạ thành trạng thái riêng: `401` về đăng nhập, `403` không có quyền, `404` không tồn tại, `409` xung đột, `422` lỗi dữ liệu.

## Decimal và dữ liệu authoritative

Quantity và money truyền dưới dạng chuỗi thập phân. FE dùng `decimal.js` để hiển thị/tính tạm giỏ hàng; backend vẫn là nguồn quyết định cuối cùng cho giá bán, giá vốn và tồn khả dụng.
