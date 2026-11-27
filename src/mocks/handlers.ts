import { delay, http, HttpResponse } from "msw";
import Decimal from "decimal.js";
import {
  mockInventoryItems,
  mockProducts,
  mockUnits,
  posProducts,
  resources,
  sessionUser,
} from "@/mocks/data";
import type {
  AddInventoryItemUnitRequest,
  AddProductVariantRequest,
  ConversionPreviewRequest,
  CreateInventoryItemRequest,
  CreateProductRequest,
  CreateUnitRequest,
  InventoryItem,
  PreviewItemConversionRequest,
  Product,
  ProductVariant,
  Unit,
  UpdateInventoryItemRequest,
  UpdateProductRequest,
  UpdateProductVariantRequest,
  UpdateUnitRequest,
} from "@/features/catalog/types";

let currentUnits: Unit[] = [...mockUnits];
let currentInventoryItems: InventoryItem[] = mockInventoryItems.map((it) => ({
  ...it,
  item_units: [...it.item_units],
}));
let currentProducts: Product[] = mockProducts.map((p) => ({
  ...p,
  variants: [...p.variants],
}));

export function resetMockUnits() {
  currentUnits = [...mockUnits];
  currentInventoryItems = mockInventoryItems.map((it) => ({
    ...it,
    item_units: [...it.item_units],
  }));
  currentProducts = mockProducts.map((p) => ({
    ...p,
    variants: [...p.variants],
  }));
}

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
  http.get("*/api/v1/auth/csrf", async () => {
    await delay(50);
    return HttpResponse.json(
      {
        headerName: "X-XSRF-TOKEN",
        parameterName: "_csrf",
        token: "mock-csrf-token",
      },
      {
        headers: {
          "Set-Cookie": "XSRF-TOKEN=mock-csrf-token; Path=/",
        },
      },
    );
  }),
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
  http.get("*/api/v1/auth/me", async () => {
    await delay(80);
    return authenticated
      ? HttpResponse.json(sessionUser)
      : problem(
          401,
          "Chưa đăng nhập",
          "Phiên làm việc không tồn tại hoặc đã hết hạn.",
          "UNAUTHENTICATED",
          "/api/v1/auth/me",
        );
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
  http.post("*/api/v1/setup/workspace", async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as {
      tenant_code?: string;
      tenant_name?: string;
      owner_email?: string;
      owner_password?: string;
    };
    const code = body.tenant_code?.trim().toUpperCase();
    const email = body.owner_email?.trim().toLowerCase();

    if (!code || !body.tenant_name?.trim() || !email || !body.owner_password || body.owner_password.length < 6) {
      return problem(
        400,
        "Dữ liệu không hợp lệ",
        "Vui lòng nhập đầy đủ thông tin thiết lập không gian làm việc.",
        "VALIDATION_ERROR",
        "/api/v1/setup/workspace",
      );
    }

    if (code === "EXISTING_TENANT") {
      return problem(
        409,
        "Mã không gian làm việc đã tồn tại",
        `Mã '${code}' đã được sử dụng.`,
        "TENANT_CODE_ALREADY_EXISTS",
        "/api/v1/setup/workspace",
      );
    }

    if (email === sessionUser.email.toLowerCase()) {
      return problem(
        409,
        "Email đã được sử dụng",
        `Email '${email}' đã tồn tại trong hệ thống.`,
        "OWNER_EMAIL_ALREADY_EXISTS",
        "/api/v1/setup/workspace",
      );
    }

    return HttpResponse.json(
      {
        tenant_id: crypto.randomUUID(),
        branch_id: crypto.randomUUID(),
        material_warehouse_id: crypto.randomUUID(),
        finished_goods_warehouse_id: crypto.randomUUID(),
        owner_id: crypto.randomUUID(),
      },
      { status: 201 },
    );
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
  // Unit of Measure & Conversion Preview endpoints (WP 008)
  http.get("*/api/v1/units", async ({ request }) => {
    await delay(100);
    const error = scenarioProblem(request);
    if (error) return error;

    const url = new URL(request.url);
    const dimension = url.searchParams.get("dimension");
    const status = url.searchParams.get("status");

    let list = [...currentUnits];
    if (dimension) list = list.filter((u) => u.dimension === dimension);
    if (status) list = list.filter((u) => u.status === status);

    return HttpResponse.json(list);
  }),

  http.get("*/api/v1/units/:id", async ({ params }) => {
    await delay(80);
    const unit = currentUnits.find((u) => u.id === params.id);
    if (!unit) {
      return problem(
        404,
        "Không tìm thấy",
        "Đơn vị tính không tồn tại.",
        "UNIT_NOT_FOUND",
        `/api/v1/units/${params.id}`,
      );
    }
    return HttpResponse.json(unit);
  }),

  http.post("*/api/v1/units", async ({ request }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const body = (await request.json()) as CreateUnitRequest;
    if (!body.code || !body.name || !body.symbol) {
      return problem(
        422,
        "Dữ liệu không hợp lệ",
        "Mã, tên và ký hiệu là bắt buộc.",
        "VALIDATION_ERROR",
        "/api/v1/units",
      );
    }

    const normalizedCode = body.code.trim().toUpperCase();
    if (currentUnits.some((u) => u.code.toUpperCase() === normalizedCode)) {
      return problem(
        409,
        "Mã đã tồn tại",
        `Mã đơn vị tính '${normalizedCode}' đã được sử dụng.`,
        "DUPLICATE_UNIT_CODE",
        "/api/v1/units",
      );
    }

    const newUnit: Unit = {
      id: crypto.randomUUID(),
      code: normalizedCode,
      name: body.name.trim(),
      symbol: body.symbol.trim(),
      dimension: body.dimension,
      ratio_to_base: body.is_base ? "1" : String(body.ratio_to_base),
      scale: body.scale ?? 2,
      is_base: Boolean(body.is_base),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 0,
    };

    currentUnits = [newUnit, ...currentUnits];
    return HttpResponse.json(newUnit, { status: 201 });
  }),

  http.put("*/api/v1/units/:id", async ({ request, params }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const unit = currentUnits.find((u) => u.id === params.id);
    if (!unit) {
      return problem(
        404,
        "Không tìm thấy",
        "Đơn vị tính không tồn tại.",
        "UNIT_NOT_FOUND",
        `/api/v1/units/${params.id}`,
      );
    }

    const body = (await request.json()) as UpdateUnitRequest;
    if (unit.version !== body.version) {
      return problem(
        409,
        "Xung đột phiên bản",
        "Đơn vị tính vừa được người khác cập nhật. Hãy tải lại.",
        "VERSION_CONFLICT",
        `/api/v1/units/${params.id}`,
      );
    }

    unit.name = body.name.trim();
    unit.symbol = body.symbol.trim();
    unit.ratio_to_base = body.is_base ? "1" : String(body.ratio_to_base);
    unit.scale = body.scale;
    unit.is_base = Boolean(body.is_base);
    unit.version += 1;
    unit.updated_at = new Date().toISOString();

    return HttpResponse.json(unit);
  }),

  http.post("*/api/v1/units/:id/activate", async ({ params }) => {
    await delay(80);
    const unit = currentUnits.find((u) => u.id === params.id);
    if (!unit) {
      return problem(
        404,
        "Không tìm thấy",
        "Đơn vị tính không tồn tại.",
        "UNIT_NOT_FOUND",
        `/api/v1/units/${params.id}/activate`,
      );
    }
    unit.status = "active";
    unit.version += 1;
    unit.updated_at = new Date().toISOString();
    return HttpResponse.json(unit);
  }),

  http.post("*/api/v1/units/:id/deactivate", async ({ params }) => {
    await delay(80);
    const unit = currentUnits.find((u) => u.id === params.id);
    if (!unit) {
      return problem(
        404,
        "Không tìm thấy",
        "Đơn vị tính không tồn tại.",
        "UNIT_NOT_FOUND",
        `/api/v1/units/${params.id}/deactivate`,
      );
    }
    unit.status = "inactive";
    unit.version += 1;
    unit.updated_at = new Date().toISOString();
    return HttpResponse.json(unit);
  }),

  http.post("*/api/v1/unit-conversions/preview", async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as ConversionPreviewRequest;
    const source = currentUnits.find((u) => u.id === body.source_unit_id);
    const target = currentUnits.find((u) => u.id === body.target_unit_id);

    if (!source || !target) {
      return problem(
        404,
        "Không tìm thấy",
        "Một trong hai đơn vị tính không tồn tại.",
        "UNIT_NOT_FOUND",
        "/api/v1/unit-conversions/preview",
      );
    }

    if (source.dimension !== target.dimension) {
      return problem(
        422,
        "Không thể quy đổi chéo",
        `Không thể quy đổi giữa hai nhóm đại lượng khác nhau (${source.dimension} sang ${target.dimension}).`,
        "CROSS_DIMENSION_CONVERSION",
        "/api/v1/unit-conversions/preview",
      );
    }

    const qty = new Decimal(body.quantity);
    const baseAmount = qty.times(new Decimal(source.ratio_to_base));
    const convertedAmount = baseAmount.dividedBy(new Decimal(target.ratio_to_base));

    return HttpResponse.json({
      source_unit_id: source.id,
      source_unit_code: source.code,
      target_unit_id: target.id,
      target_unit_code: target.code,
      entered_quantity: body.quantity,
      converted_quantity: convertedAmount.toFixed(target.scale),
    });
  }),

  // ----------------------------------------------------
  // Inventory Items Handlers (WP 009)
  // ----------------------------------------------------
  http.get("*/api/v1/inventory-items", async ({ request }) => {
    await delay(100);
    const error = scenarioProblem(request);
    if (error) return error;

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let list = [...currentInventoryItems];
    if (type) list = list.filter((it) => it.item_type === type);
    if (status) list = list.filter((it) => it.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (it) => it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q),
      );
    }

    return HttpResponse.json(list);
  }),

  http.get("*/api/v1/inventory-items/:id", async ({ params }) => {
    await delay(80);
    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}`,
      );
    }
    return HttpResponse.json(item);
  }),

  http.post("*/api/v1/inventory-items", async ({ request }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const body = (await request.json()) as CreateInventoryItemRequest;
    if (!body.code || !body.name || !body.item_type || !body.base_unit_id) {
      return problem(
        422,
        "Dữ liệu không hợp lệ",
        "Mã, tên, phân loại và đơn vị gốc là bắt buộc.",
        "VALIDATION_ERROR",
        "/api/v1/inventory-items",
      );
    }

    const normalizedCode = body.code.trim().toUpperCase();
    if (currentInventoryItems.some((it) => it.code.toUpperCase() === normalizedCode)) {
      return problem(
        409,
        "Mã đã tồn tại",
        `Mã mặt hàng '${normalizedCode}' đã được sử dụng.`,
        "DUPLICATE_ITEM_CODE",
        "/api/v1/inventory-items",
      );
    }

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      code: normalizedCode,
      name: body.name.trim(),
      item_type: body.item_type,
      base_unit_id: body.base_unit_id,
      status: "active",
      item_units: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 0,
    };

    currentInventoryItems = [newItem, ...currentInventoryItems];
    return HttpResponse.json(newItem, { status: 201 });
  }),

  http.put("*/api/v1/inventory-items/:id", async ({ request, params }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}`,
      );
    }

    const body = (await request.json()) as UpdateInventoryItemRequest;
    if (item.version !== body.version) {
      return problem(
        409,
        "Xung đột phiên bản",
        "Mặt hàng vừa được người khác cập nhật. Hãy tải lại.",
        "STALE_ITEM_VERSION",
        `/api/v1/inventory-items/${params.id}`,
      );
    }

    item.name = body.name.trim();
    item.item_type = body.item_type;
    item.base_unit_id = body.base_unit_id;
    item.version += 1;
    item.updated_at = new Date().toISOString();

    return HttpResponse.json(item);
  }),

  http.post("*/api/v1/inventory-items/:id/activate", async ({ params }) => {
    await delay(80);
    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/activate`,
      );
    }
    item.status = "active";
    item.version += 1;
    item.updated_at = new Date().toISOString();
    return HttpResponse.json(item);
  }),

  http.post("*/api/v1/inventory-items/:id/deactivate", async ({ params }) => {
    await delay(80);
    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/deactivate`,
      );
    }
    item.status = "inactive";
    item.version += 1;
    item.updated_at = new Date().toISOString();
    return HttpResponse.json(item);
  }),

  http.post("*/api/v1/inventory-items/:id/units", async ({ request, params }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/units`,
      );
    }

    const body = (await request.json()) as AddInventoryItemUnitRequest;
    if (item.base_unit_id === body.unit_id) {
      return problem(
        422,
        "Quy cách không hợp lệ",
        "Đơn vị gốc không thể được sử dụng làm đơn vị đóng gói.",
        "BASE_UNIT_CANNOT_BE_PACKAGING_UNIT",
        `/api/v1/inventory-items/${params.id}/units`,
      );
    }

    if (item.item_units.some((u) => u.unit_id === body.unit_id)) {
      return problem(
        409,
        "Quy cách đã tồn tại",
        "Quy cách đóng gói này đã được khai báo cho mặt hàng.",
        "DUPLICATE_ITEM_UNIT",
        `/api/v1/inventory-items/${params.id}/units`,
      );
    }

    item.item_units.push({
      id: crypto.randomUUID(),
      unit_id: body.unit_id,
      factor_to_item_base: String(body.factor_to_item_base),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 0,
    });
    item.updated_at = new Date().toISOString();

    return HttpResponse.json(item, { status: 201 });
  }),

  http.delete("*/api/v1/inventory-items/:id/units/:unitId", async ({ params }) => {
    await delay(80);
    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/units/${params.unitId}`,
      );
    }

    item.item_units = item.item_units.filter((u) => u.unit_id !== params.unitId);
    item.updated_at = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("*/api/v1/inventory-items/:id/preview-conversion", async ({ request, params }) => {
    await delay(100);
    const item = currentInventoryItems.find((it) => it.id === params.id);
    if (!item) {
      return problem(
        404,
        "Không tìm thấy",
        "Mặt hàng không tồn tại.",
        "INVENTORY_ITEM_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/preview-conversion`,
      );
    }

    const body = (await request.json()) as PreviewItemConversionRequest;
    const pkgUnit = item.item_units.find((u) => u.unit_id === body.package_unit_id);
    if (!pkgUnit) {
      return problem(
        404,
        "Không tìm thấy quy cách",
        "Quy cách đóng gói không thuộc mặt hàng này.",
        "PACKAGING_UNIT_NOT_FOUND",
        `/api/v1/inventory-items/${params.id}/preview-conversion`,
      );
    }

    const factor = new Decimal(pkgUnit.factor_to_item_base);
    const qty = new Decimal(body.entered_quantity);
    const converted = qty.times(factor);

    return HttpResponse.json({
      item_id: item.id,
      package_unit_id: body.package_unit_id,
      entered_quantity: body.entered_quantity,
      base_unit_id: item.base_unit_id,
      converted_base_quantity: converted.toString(),
    });
  }),

  // ----------------------------------------------------
  // Products & Sellable Variants Handlers (WP 010)
  // ----------------------------------------------------
  http.get("*/api/v1/products", async ({ request }) => {
    await delay(100);
    const error = scenarioProblem(request);
    if (error) return error;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let list = [...currentProducts];
    if (status) list = list.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
      );
    }

    return HttpResponse.json(list);
  }),

  http.get("*/api/v1/products/:id", async ({ params }) => {
    await delay(80);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}`,
      );
    }
    return HttpResponse.json(product);
  }),

  http.post("*/api/v1/products", async ({ request }) => {
    await delay(120);
    const error = scenarioProblem(request);
    if (error) return error;

    const body = (await request.json()) as CreateProductRequest;
    if (!body.code || !body.name || !body.variants || body.variants.length === 0) {
      return problem(
        400,
        "Dữ liệu không hợp lệ",
        "Mã sản phẩm, tên sản phẩm và ít nhất một biến thể là bắt buộc.",
        "VALIDATION_ERROR",
        "/api/v1/products",
      );
    }

    const normalizedCode = body.code.trim().toUpperCase();
    if (currentProducts.some((p) => p.code.toUpperCase() === normalizedCode)) {
      return problem(
        409,
        "Mã sản phẩm đã tồn tại",
        `Mã sản phẩm '${normalizedCode}' đã được sử dụng.`,
        "DUPLICATE_PRODUCT_CODE",
        "/api/v1/products",
      );
    }

    const productId = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const createdVariants: ProductVariant[] = [];

    for (const vReq of body.variants) {
      const linkedItem = currentInventoryItems.find((it) => it.id === vReq.inventory_item_id);
      if (
        !linkedItem ||
        linkedItem.status !== "active" ||
        (linkedItem.item_type !== "finished_good" && linkedItem.item_type !== "resale_good")
      ) {
        return problem(
          422,
          "Liên kết kho không hợp lệ",
          "Mặt hàng kho liên kết phải đang hoạt động và thuộc loại Thành phẩm hoặc Hàng thương mại.",
          "INVALID_LINKED_INVENTORY_ITEM",
          "/api/v1/products",
        );
      }

      const normSku = vReq.sku.trim().toUpperCase();
      const skuExists =
        currentProducts.some((p) => p.variants.some((v) => v.sku.toUpperCase() === normSku)) ||
        createdVariants.some((v) => v.sku.toUpperCase() === normSku);
      if (skuExists) {
        return problem(
          409,
          "SKU đã tồn tại",
          `Mã SKU '${normSku}' đã được sử dụng trong hệ thống.`,
          "DUPLICATE_PRODUCT_SKU",
          "/api/v1/products",
        );
      }

      const cleanBarcode = vReq.barcode?.trim() ? vReq.barcode.trim() : null;
      if (cleanBarcode) {
        const normBc = cleanBarcode.toUpperCase();
        const bcExists =
          currentProducts.some((p) =>
            p.variants.some((v) => v.barcode?.toUpperCase() === normBc),
          ) || createdVariants.some((v) => v.barcode?.toUpperCase() === normBc);
        if (bcExists) {
          return problem(
            409,
            "Barcode đã tồn tại",
            `Barcode '${cleanBarcode}' đã được gán cho biến thể khác.`,
            "DUPLICATE_PRODUCT_BARCODE",
            "/api/v1/products",
          );
        }
      }

      createdVariants.push({
        id: crypto.randomUUID(),
        product_id: productId,
        inventory_item_id: vReq.inventory_item_id,
        sku: normSku,
        barcode: cleanBarcode,
        name: vReq.name.trim(),
        sale_price: vReq.sale_price,
        currency: vReq.currency.trim().toUpperCase(),
        tax_rate: vReq.tax_rate,
        status: "active",
        created_at: nowIso,
        updated_at: nowIso,
        version: 0,
      });
    }

    const newProduct: Product = {
      id: productId,
      code: normalizedCode,
      name: body.name.trim(),
      status: "active",
      variants: createdVariants,
      created_at: nowIso,
      updated_at: nowIso,
      version: 0,
    };

    currentProducts = [newProduct, ...currentProducts];
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  http.put("*/api/v1/products/:id", async ({ request, params }) => {
    await delay(100);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}`,
      );
    }

    const body = (await request.json()) as UpdateProductRequest;
    if (product.version !== body.version) {
      return problem(
        409,
        "Xung đột phiên bản",
        "Sản phẩm vừa được cập nhật bởi yêu cầu khác.",
        "STALE_PRODUCT_VERSION",
        `/api/v1/products/${params.id}`,
      );
    }

    const normCode = body.code.trim().toUpperCase();
    if (currentProducts.some((p) => p.id !== product.id && p.code.toUpperCase() === normCode)) {
      return problem(
        409,
        "Mã đã tồn tại",
        `Mã sản phẩm '${normCode}' đã được sử dụng.`,
        "DUPLICATE_PRODUCT_CODE",
        `/api/v1/products/${params.id}`,
      );
    }

    product.code = normCode;
    product.name = body.name.trim();
    product.version += 1;
    product.updated_at = new Date().toISOString();
    return HttpResponse.json(product);
  }),

  http.post("*/api/v1/products/:id/activate", async ({ params }) => {
    await delay(80);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}/activate`,
      );
    }
    product.status = "active";
    product.version += 1;
    product.updated_at = new Date().toISOString();
    return HttpResponse.json(product);
  }),

  http.post("*/api/v1/products/:id/deactivate", async ({ params }) => {
    await delay(80);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}/deactivate`,
      );
    }
    product.status = "inactive";
    product.version += 1;
    product.updated_at = new Date().toISOString();
    return HttpResponse.json(product);
  }),

  http.post("*/api/v1/products/:id/variants", async ({ request, params }) => {
    await delay(100);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}/variants`,
      );
    }

    const body = (await request.json()) as AddProductVariantRequest;
    const linkedItem = currentInventoryItems.find((it) => it.id === body.inventory_item_id);
    if (
      !linkedItem ||
      linkedItem.status !== "active" ||
      (linkedItem.item_type !== "finished_good" && linkedItem.item_type !== "resale_good")
    ) {
      return problem(
        422,
        "Liên kết kho không hợp lệ",
        "Mặt hàng kho liên kết phải đang hoạt động và thuộc loại Thành phẩm hoặc Hàng thương mại.",
        "INVALID_LINKED_INVENTORY_ITEM",
        `/api/v1/products/${params.id}/variants`,
      );
    }

    const normSku = body.sku.trim().toUpperCase();
    if (currentProducts.some((p) => p.variants.some((v) => v.sku.toUpperCase() === normSku))) {
      return problem(
        409,
        "SKU đã tồn tại",
        `Mã SKU '${normSku}' đã được sử dụng.`,
        "DUPLICATE_PRODUCT_SKU",
        `/api/v1/products/${params.id}/variants`,
      );
    }

    const cleanBarcode = body.barcode?.trim() ? body.barcode.trim() : null;
    if (
      cleanBarcode &&
      currentProducts.some((p) =>
        p.variants.some((v) => v.barcode?.toUpperCase() === cleanBarcode.toUpperCase()),
      )
    ) {
      return problem(
        409,
        "Barcode đã tồn tại",
        `Barcode '${cleanBarcode}' đã được sử dụng.`,
        "DUPLICATE_PRODUCT_BARCODE",
        `/api/v1/products/${params.id}/variants`,
      );
    }

    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      product_id: product.id,
      inventory_item_id: body.inventory_item_id,
      sku: normSku,
      barcode: cleanBarcode,
      name: body.name.trim(),
      sale_price: body.sale_price,
      currency: body.currency.trim().toUpperCase(),
      tax_rate: body.tax_rate,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 0,
    };

    product.variants.push(newVariant);
    return HttpResponse.json(newVariant, { status: 201 });
  }),

  http.put("*/api/v1/products/:id/variants/:variantId", async ({ request, params }) => {
    await delay(100);
    const product = currentProducts.find((p) => p.id === params.id);
    if (!product) {
      return problem(
        404,
        "Không tìm thấy",
        "Sản phẩm không tồn tại.",
        "PRODUCT_NOT_FOUND",
        `/api/v1/products/${params.id}/variants/${params.variantId}`,
      );
    }

    const variant = product.variants.find((v) => v.id === params.variantId);
    if (!variant) {
      return problem(
        404,
        "Không tìm thấy",
        "Biến thể không tồn tại.",
        "PRODUCT_VARIANT_NOT_FOUND",
        `/api/v1/products/${params.id}/variants/${params.variantId}`,
      );
    }

    const body = (await request.json()) as UpdateProductVariantRequest;
    if (variant.version !== body.version) {
      return problem(
        409,
        "Xung đột phiên bản",
        "Biến thể vừa được cập nhật bởi yêu cầu khác.",
        "STALE_VARIANT_VERSION",
        `/api/v1/products/${params.id}/variants/${params.variantId}`,
      );
    }

    const normSku = body.sku.trim().toUpperCase();
    if (
      currentProducts.some((p) =>
        p.variants.some((v) => v.id !== variant.id && v.sku.toUpperCase() === normSku),
      )
    ) {
      return problem(
        409,
        "SKU đã tồn tại",
        `Mã SKU '${normSku}' đã được sử dụng.`,
        "DUPLICATE_PRODUCT_SKU",
        `/api/v1/products/${params.id}/variants/${params.variantId}`,
      );
    }

    variant.inventory_item_id = body.inventory_item_id;
    variant.sku = normSku;
    variant.barcode = body.barcode?.trim() ? body.barcode.trim() : null;
    variant.name = body.name.trim();
    variant.sale_price = body.sale_price;
    variant.currency = body.currency.trim().toUpperCase();
    variant.tax_rate = body.tax_rate;
    variant.version += 1;
    variant.updated_at = new Date().toISOString();

    return HttpResponse.json(variant);
  }),

  http.post("*/api/v1/products/:id/variants/:variantId/activate", async ({ params }) => {
    await delay(80);
    const product = currentProducts.find((p) => p.id === params.id);
    const variant = product?.variants.find((v) => v.id === params.variantId);
    if (!variant) {
      return problem(
        404,
        "Không tìm thấy",
        "Biến thể không tồn tại.",
        "PRODUCT_VARIANT_NOT_FOUND",
        `/api/v1/products/${params.id}/variants/${params.variantId}/activate`,
      );
    }
    variant.status = "active";
    variant.version += 1;
    variant.updated_at = new Date().toISOString();
    return HttpResponse.json(variant);
  }),

  http.post("*/api/v1/products/:id/variants/:variantId/deactivate", async ({ params }) => {
    await delay(80);
    const product = currentProducts.find((p) => p.id === params.id);
    const variant = product?.variants.find((v) => v.id === params.variantId);
    if (!variant) {
      return problem(
        404,
        "Không tìm thấy",
        "Biến thể không tồn tại.",
        "PRODUCT_VARIANT_NOT_FOUND",
        `/api/v1/products/${params.id}/variants/${params.variantId}/deactivate`,
      );
    }
    variant.status = "inactive";
    variant.version += 1;
    variant.updated_at = new Date().toISOString();
    return HttpResponse.json(variant);
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
