import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { currentMockScenario, readCookie } from "@/shared/lib/http";

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
    credentials: "include",
    prepareHeaders: (headers) => {
      headers.set("accept", "application/json");
      headers.set("x-mock-scenario", currentMockScenario());
      const csrf = readCookie("XSRF-TOKEN");
      if (csrf) headers.set("x-xsrf-token", decodeURIComponent(csrf));
      return headers;
    },
  }),
  tagTypes: ["Session", "Resource", "Dashboard", "Cart", "Jobs"],
  endpoints: () => ({}),
});
