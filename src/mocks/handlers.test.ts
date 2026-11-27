import { describe, expect, it } from "vitest";

describe("mock API", () => {
  it("trả danh sách dữ liệu theo đúng contract", async () => {
    const response = await fetch("http://localhost/api/v1/catalog/items");
    const body = (await response.json()) as { data: unknown[]; total: number };
    expect(response.status).toBe(200);
    expect(body.total).toBeGreaterThan(0);
    expect(body.data).toHaveLength(body.total);
  });

  it("mô phỏng trạng thái rỗng", async () => {
    const response = await fetch("http://localhost/api/v1/catalog/items", {
      headers: { "x-mock-scenario": "empty" },
    });
    const body = (await response.json()) as { data: unknown[]; total: number };
    expect(body).toEqual({ data: [], total: 0 });
  });

  it("trả ProblemDetail ổn định cho lỗi phân quyền", async () => {
    const response = await fetch("http://localhost/api/v1/catalog/items", {
      headers: { "x-mock-scenario": "forbidden" },
    });
    const body = (await response.json()) as { status: number; code: string; correlation_id: string };
    expect(response.status).toBe(403);
    expect(body).toMatchObject({ status: 403, code: "ACCESS_DENIED" });
    expect(body.correlation_id).toBeTruthy();
  });

  it("trả danh sách đơn vị tính units với lọc dimension và status", async () => {
    const resAll = await fetch("http://localhost/api/v1/units");
    const unitsAll = (await resAll.json()) as Array<{ code: string; dimension: string }>;
    expect(resAll.status).toBe(200);
    expect(unitsAll.length).toBeGreaterThanOrEqual(4);

    const resMass = await fetch("http://localhost/api/v1/units?dimension=mass");
    const unitsMass = (await resMass.json()) as Array<{ code: string; dimension: string }>;
    expect(resMass.status).toBe(200);
    expect(unitsMass.every((u) => u.dimension === "mass")).toBe(true);
  });

  it("tính thử quy đổi xem trước (Conversion Preview) chính xác 2500 g = 2.5 kg", async () => {
    const resUnits = await fetch("http://localhost/api/v1/units");
    const units = (await resUnits.json()) as Array<{ id: string; code: string }>;
    const gram = units.find((u) => u.code === "G")!;
    const kg = units.find((u) => u.code === "KG")!;

    const previewRes = await fetch("http://localhost/api/v1/unit-conversions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_unit_id: gram.id,
        target_unit_id: kg.id,
        quantity: "2500",
      }),
    });

    expect(previewRes.status).toBe(200);
    const previewData = (await previewRes.json()) as {
      entered_quantity: string;
      converted_quantity: string;
      source_unit_code: string;
      target_unit_code: string;
    };
    expect(previewData.entered_quantity).toBe("2500");
    expect(previewData.converted_quantity).toBe("2.500");
    expect(previewData.source_unit_code).toBe("G");
    expect(previewData.target_unit_code).toBe("KG");
  });

  it("báo lỗi 422 khi thử quy đổi chéo dimension (g sang ml)", async () => {
    const resUnits = await fetch("http://localhost/api/v1/units");
    const units = (await resUnits.json()) as Array<{ id: string; code: string }>;
    const gram = units.find((u) => u.code === "G")!;
    const ml = units.find((u) => u.code === "ML")!;

    const previewRes = await fetch("http://localhost/api/v1/unit-conversions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_unit_id: gram.id,
        target_unit_id: ml.id,
        quantity: "100",
      }),
    });

    expect(previewRes.status).toBe(422);
    const err = (await previewRes.json()) as { code: string };
    expect(err.code).toBe("CROSS_DIMENSION_CONVERSION");
  });

  it("trả danh sách mặt hàng kho inventory-items với lọc type và status", async () => {
    const resAll = await fetch("http://localhost/api/v1/inventory-items");
    const itemsAll = (await resAll.json()) as Array<{ code: string; item_type: string }>;
    expect(resAll.status).toBe(200);
    expect(itemsAll.length).toBeGreaterThanOrEqual(4);

    const resMaterial = await fetch("http://localhost/api/v1/inventory-items?type=material");
    const itemsMaterial = (await resMaterial.json()) as Array<{ code: string; item_type: string }>;
    expect(resMaterial.status).toBe(200);
    expect(itemsMaterial.every((it) => it.item_type === "material")).toBe(true);
  });

  it("tính thử xem trước quy đổi bao gói mặt hàng (Item Packaging Preview)", async () => {
    const resItems = await fetch("http://localhost/api/v1/inventory-items");
    const items = (await resItems.json()) as Array<{
      id: string;
      code: string;
      item_units: Array<{ unit_id: string; factor_to_item_base: string }>;
    }>;
    const botMi = items.find((it) => it.code === "NL-BOT-13")!;
    const pkgUnit = botMi.item_units[0];

    const previewRes = await fetch(
      `http://localhost/api/v1/inventory-items/${botMi.id}/preview-conversion`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_unit_id: pkgUnit.unit_id,
          entered_quantity: "4",
        }),
      },
    );

    expect(previewRes.status).toBe(200);
    const previewData = (await previewRes.json()) as {
      entered_quantity: string;
      converted_base_quantity: string;
    };
    expect(previewData.entered_quantity).toBe("4");
    // 4 bao x 25 = 100
    expect(previewData.converted_base_quantity).toBe("100");
  });

  it("báo lỗi 409 khi tạo mặt hàng trùng mã SKU", async () => {
    const res = await fetch("http://localhost/api/v1/inventory-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "NL-BOT-13",
        name: "Trùng mã",
        item_type: "material",
        base_unit_id: "019a4d89-6c49-7da3-8120-111111111111",
      }),
    });

    expect(res.status).toBe(409);
    const err = (await res.json()) as { code: string };
    expect(err.code).toBe("DUPLICATE_ITEM_CODE");
  });

  it("trả danh sách sản phẩm và biến thể bán hàng (WP 010)", async () => {
    const res = await fetch("http://localhost/api/v1/products");
    const products = (await res.json()) as Array<{
      code: string;
      variants: Array<{ sku: string; barcode: string | null }>;
    }>;
    expect(res.status).toBe(200);
    expect(products.length).toBeGreaterThanOrEqual(2);
    expect(products.some((p) => p.code === "SP-BMHC")).toBe(true);
    expect(products.some((p) => p.code === "SP-NUOC")).toBe(true);
  });

  it("chặn liên kết biến thể với mặt hàng nguyên liệu (422 INVALID_LINKED_INVENTORY_ITEM)", async () => {
    const res = await fetch("http://localhost/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "SP-TEST-ERR",
        name: "Sản phẩm lỗi",
        variants: [
          {
            inventory_item_id: "019a4d89-7000-7da3-8120-000000000001", // NL-BOT-13 (material)
            sku: "SKU-ERR-01",
            barcode: null,
            name: "Gói 1kg",
            sale_price: 25000,
            currency: "VND",
            tax_rate: 0.08,
          },
        ],
      }),
    });

    expect(res.status).toBe(422);
    const err = (await res.json()) as { code: string };
    expect(err.code).toBe("INVALID_LINKED_INVENTORY_ITEM");
  });
});
