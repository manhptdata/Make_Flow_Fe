import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { store } from "@/app/store";
import { clearCsrfToken, getCsrfToken, setCsrfToken } from "@/app/api/baseApi";
import { useUpdateUnitMutation } from "@/features/catalog/api";
import { server } from "@/mocks/server";

function wrapper({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

describe("baseApi CSRF handshake & auto-recovery", () => {
  beforeEach(() => {
    clearCsrfToken();
  });

  it("tự động gọi GET /auth/csrf trước mutation khi chưa có token trong RAM (sau F5)", async () => {
    let seenCsrfHeader: string | null = null;

    server.use(
      http.get("*/api/v1/auth/csrf", () => {
        return HttpResponse.json({ token: "xor-fresh-token-after-f5" });
      }),
      http.put("*/api/v1/units/:id", ({ request }) => {
        seenCsrfHeader = request.headers.get("x-xsrf-token");
        return HttpResponse.json({
          id: "u1",
          code: "G",
          name: "gram",
          symbol: "g",
          dimension: "mass",
          ratio_to_base: "0.001",
          scale: 2,
          is_base: false,
          status: "active",
          version: 1,
        });
      }),
    );

    expect(getCsrfToken()).toBeUndefined();

    const { result } = renderHook(() => useUpdateUnitMutation(), { wrapper });
    const [updateUnit] = result.current;

    const updated = await updateUnit({
      id: "u1",
      body: {
        name: "gram",
        symbol: "g",
        ratio_to_base: "0.001",
        scale: 2,
        is_base: false,
        version: 0,
      },
    }).unwrap();

    expect(updated.ratio_to_base).toBe("0.001");
    expect(seenCsrfHeader).toBe("xor-fresh-token-after-f5");
    expect(getCsrfToken()).toBe("xor-fresh-token-after-f5");
  });

  it("tự động làm mới CSRF token và retry 1 lần khi mutation gặp lỗi 403", async () => {
    setCsrfToken("stale-token");
    let attempts = 0;

    server.use(
      http.get("*/api/v1/auth/csrf", () => {
        return HttpResponse.json({ token: "recovered-xor-token" });
      }),
      http.put("*/api/v1/units/:id", ({ request }) => {
        attempts += 1;
        const header = request.headers.get("x-xsrf-token");
        if (header !== "recovered-xor-token") {
          return HttpResponse.json(
            { status: 403, title: "Forbidden", detail: "Access is denied", code: "IDENTITY_003" },
            { status: 403 },
          );
        }
        return HttpResponse.json({
          id: "u1",
          code: "G",
          name: "gram",
          symbol: "g",
          dimension: "mass",
          ratio_to_base: "0.001",
          scale: 2,
          is_base: false,
          status: "active",
          version: 1,
        });
      }),
    );

    const { result } = renderHook(() => useUpdateUnitMutation(), { wrapper });
    const [updateUnit] = result.current;

    const updated = await updateUnit({
      id: "u1",
      body: {
        name: "gram",
        symbol: "g",
        ratio_to_base: "0.001",
        scale: 2,
        is_base: false,
        version: 0,
      },
    }).unwrap();

    expect(attempts).toBe(2);
    expect(updated.code).toBe("G");
    expect(getCsrfToken()).toBe("recovered-xor-token");
  });
});
