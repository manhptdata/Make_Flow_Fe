import { describe, expect, it } from "vitest";
import { routeCatalog } from "@/routes/routeCatalog";

describe("route catalog", () => {
  it("không trùng route và bao phủ luồng MVP", () => {
    expect(new Set(routeCatalog).size).toBe(routeCatalog.length);
    expect(routeCatalog).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/catalog/items",
        "/inventory/balances",
        "/production",
        "/pos",
        "/sales/orders",
        "/reports/gross-profit",
      ]),
    );
  });
});
