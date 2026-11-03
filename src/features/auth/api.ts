import { baseApi } from "@/app/api/baseApi";
import type { SessionUser } from "@/shared/types/api";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSession: builder.query<SessionUser, void>({ query: () => "/auth/session", providesTags: ["Session"] }),
    login: builder.mutation<SessionUser, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
  }),
});
export const { useGetSessionQuery, useLoginMutation, useLogoutMutation } = authApi;
