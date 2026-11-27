import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { currentMockScenario, readCookie } from "@/shared/lib/http";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== "undefined" && window.location?.origin && window.location.origin !== "null") {
    return `${window.location.origin}/api/v1`;
  }
  return "http://localhost/api/v1";
};

let activeCsrfToken: string | null = null;
let pendingCsrfRequest: Promise<string | null> | null = null;

export function setCsrfToken(token: string) {
  activeCsrfToken = token;
}

export function clearCsrfToken() {
  activeCsrfToken = null;
}

export function getCsrfToken() {
  return activeCsrfToken || readCookie("XSRF-TOKEN");
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("accept", "application/json");
    headers.set("x-mock-scenario", currentMockScenario());
    const csrf = getCsrfToken();
    if (csrf) headers.set("x-xsrf-token", decodeURIComponent(csrf));
    return headers;
  },
});

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function extractRequestMeta(args: string | FetchArgs) {
  if (typeof args === "string") {
    return { url: args, method: "GET" };
  }
  return { url: args.url, method: (args.method ?? "GET").toUpperCase() };
}

async function fetchFreshCsrfToken(
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2],
): Promise<string | null> {
  if (!pendingCsrfRequest) {
    pendingCsrfRequest = (async () => {
      try {
        const res = await rawBaseQuery({ url: "/auth/csrf", method: "GET" }, api, extraOptions);
        const token = (res.data as { token?: string } | undefined)?.token;
        if (token) {
          activeCsrfToken = token;
          return token;
        }
      } catch {
        // Bỏ qua nếu endpoint csrf không khả dụng; request chính sẽ phản hồi lỗi gốc
      } finally {
        pendingCsrfRequest = null;
      }
      return null;
    })();
  }
  return pendingCsrfRequest;
}

/**
 * Tự động nạp XOR-masked CSRF token của Spring Security 6 trước các thao tác ghi (kể cả sau F5)
 * và tự làm mới token một lần nếu gặp 403 do đổi Session ID.
 */
const baseQueryWithCsrf: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const { url, method } = extractRequestMeta(args);
  const isMutation = !SAFE_METHODS.has(method);
  const isCsrfExempt = url.startsWith("/auth/csrf") || url.startsWith("/setup/workspace");

  if (isMutation && !isCsrfExempt && !activeCsrfToken) {
    await fetchFreshCsrfToken(api, extraOptions);
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (
    result.error?.status === 403 &&
    isMutation &&
    !isCsrfExempt &&
    currentMockScenario() === "success"
  ) {
    clearCsrfToken();
    const refreshedToken = await fetchFreshCsrfToken(api, extraOptions);
    if (refreshedToken) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithCsrf,
  tagTypes: ["Session", "Resource", "Dashboard", "Cart", "Jobs", "Unit", "InventoryItem", "Product"],
  endpoints: () => ({}),
});
