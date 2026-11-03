import { delay, http, HttpResponse } from "msw";
import { posProducts, resources, sessionUser } from "@/mocks/data";

let authenticated = false;
const problem = (status: number, title: string, detail: string, code: string, instance: string) =>
  HttpResponse.json(
    {
      type: `https://makeflow.local/problems/${code.toLowerCase()}`,
      title,
      status,
      detail,
      code,
      instance,
      correlation_id: crypto.randomUUID(),
    },
    { status },
  );
const scenario = (request: Request) => request.headers.get("x-mock-scenario") ?? "success";

function scenarioProblem(request: Request) {
  const selected = scenario(request);
  if (selected === "error")
    return problem(
      500,
      "Không thể tải dữ liệu",
      "Mock đang mô phỏng lỗi máy chủ. Dữ liệu hiện tại vẫn được giữ nguyên.",
      "MOCK_INTERNAL_ERROR",
      new URL(request.url).pathname,
    );
  if (selected === "forbidden")
    return problem(
      403,
      "Không có quyền truy cập",
      "Vai trò hiện tại không được phép xem tài nguyên này.",
      "ACCESS_DENIED",
      new URL(request.url).pathname,
    );
  if (selected === "conflict")
    return problem(
      409,
      "Dữ liệu đã thay đổi",
      "Một người dùng khác vừa cập nhật bản ghi. Hãy tải lại trước khi tiếp tục.",
      "VERSION_CONFLICT",
      new URL(request.url).pathname,
    );
  return undefined;
}

const listResponse = async (request: Request, resource: string) => {
  await delay(180);
  const error = scenarioProblem(request);
  if (error) return error;
  const data = scenario(request) === "empty" ? [] : (resources[resource] ?? []);
  return HttpResponse.json(
    { data, total: data.length },
    { headers: { "X-Total-Count": String(data.length) } },
  );
};

const createResponse = async (request: Request, resource: string) => {
  await delay(220);
  const error = scenarioProblem(request);
  if (error) return error;
  if (!request.headers.get("Idempotency-Key"))
    return problem(
      400,
      "Thiếu idempotency key",
      "Command tạo mới phải có Idempotency-Key.",
      "IDEMPOTENCY_KEY_REQUIRED",
      new URL(request.url).pathname,
    );
  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name || body.name.trim().length < 2)
    return problem(
      422,
      "Dữ liệu không hợp lệ",
      "Tên cần ít nhất 2 ký tự.",
      "VALIDATION_ERROR",
      new URL(request.url).pathname,
    );
  const record = {
    id: crypto.randomUUID(),
    code: `NEW-${String(Date.now()).slice(-5)}`,
    name: body.name.trim(),
    description: body.description?.trim(),
    status: "draft" as const,
    updated_at: new Date().toISOString(),
  };
  resources[resource] = [record, ...(resources[resource] ?? [])];
  return HttpResponse.json(record, { status: 201 });
};

export const handlers = [
  http.post("*/api/v1/auth/login", async ({ request }) => {
    await delay(250);
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password)
      return problem(
        422,
        "Dữ liệu không hợp lệ",
        "Email và mật khẩu là bắt buộc.",
        "VALIDATION_ERROR",
        "/api/v1/auth/login",
      );
    authenticated = true;
    return HttpResponse.json(sessionUser);
  }),
  http.get("*/api/v1/auth/session", async () => {
    await delay(80);
    return authenticated
      ? HttpResponse.json(sessionUser)
      : problem(
          401,
          "Chưa đăng nhập",
          "Phiên làm việc không tồn tại hoặc đã hết hạn.",
          "UNAUTHENTICATED",
          "/api/v1/auth/session",
        );
  }),
  http.post("*/api/v1/auth/logout", () => {
    authenticated = false;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("*/api/v1/dashboard", async ({ request }) => {
    await delay(180);
    const error = scenarioProblem(request);
    if (error) return error;
    return HttpResponse.json({
      revenue: "12580000",
      inventory_value: "48650000",
      active_batches: 3,
      rejection_rate: "2.97",
      low_stock: 4,
      sales: [
        { label: "T2", value: 7.2 },
        { label: "T3", value: 9.8 },
        { label: "T4", value: 8.6 },
        { label: "T5", value: 12.1 },
        { label: "T6", value: 11.4 },
        { label: "T7", value: 16.8 },
        { label: "CN", value: 12.6 },
      ],
    });
  }),
  http.get("*/api/v1/pos/products", async ({ request }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;
    return HttpResponse.json({ data: scenario(request) === "empty" ? [] : posProducts });
  }),
  http.post("*/api/v1/pos/checkout", async ({ request }) => {
    await delay(450);
    if (scenario(request) === "conflict")
      return problem(
        409,
        "Không đủ tồn kho",
        "Sản phẩm vừa được bán ở quầy khác. Hãy làm mới giỏ hàng.",
        "INSUFFICIENT_STOCK",
        "/api/v1/pos/checkout",
      );
    const body = (await request.json()) as { lines?: unknown[] };
    if (!body.lines?.length)
      return problem(
        422,
        "Giỏ hàng trống",
        "Cần ít nhất một sản phẩm để thanh toán.",
        "EMPTY_CART",
        "/api/v1/pos/checkout",
      );
    return HttpResponse.json(
      {
        order_id: crypto.randomUUID(),
        order_code: `SO-${String(Date.now()).slice(-5)}`,
        total: "54000",
        change: "0",
      },
      { status: 201 },
    );
  }),
  http.post("*/api/v1/production/batches/:id/complete", async ({ request, params }) => {
    await delay(450);
    const error = scenarioProblem(request);
    if (error) return error;
    if (!request.headers.get("Idempotency-Key"))
      return problem(
        400,
        "Thiếu idempotency key",
        "Hoàn thành sản xuất phải có Idempotency-Key.",
        "IDEMPOTENCY_KEY_REQUIRED",
        new URL(request.url).pathname,
      );
    const batch = resources["production/batches"].find((record) => record.id === params.id);
    if (batch) batch.status = "completed";
    return HttpResponse.json({ status: "completed", usable_quantity: "96", rejected_quantity: "4" });
  }),
  http.get("*/api/v1/recipes", ({ request }) => listResponse(request, "recipes")),
  http.get("*/api/v1/jobs", ({ request }) => listResponse(request, "jobs")),
  http.get("*/api/v1/imports", ({ request }) => listResponse(request, "imports")),
  http.post("*/api/v1/:group/:resource", ({ request, params }) =>
    createResponse(request, `${params.group}/${params.resource}`),
  ),
  http.post("*/api/v1/:resource", ({ request, params }) => createResponse(request, String(params.resource))),
  http.get("*/api/v1/:group/:resource", ({ request, params }) =>
    listResponse(request, `${params.group}/${params.resource}`),
  ),
];
