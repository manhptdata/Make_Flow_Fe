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
});
