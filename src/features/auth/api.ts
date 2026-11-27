import { baseApi, clearCsrfToken, setCsrfToken } from "@/app/api/baseApi";
import type { SessionUser } from "@/shared/types/api";

interface CurrentUserBackendResponse {
  userId?: string;
  id?: string;
  tenantId?: string;
  defaultBranchId?: string;
  branchIds?: string[];
  email: string;
  role?: string;
  full_name?: string;
  permissions?: string[];
  workspace?: { id: string; name: string; branch_name: string };
}

export interface ProvisionWorkspaceRequest {
  tenant_code: string;
  tenant_name: string;
  owner_email: string;
  owner_password: string;
}

export interface ProvisionWorkspaceResponse {
  tenant_id: string;
  branch_id: string;
  material_warehouse_id: string;
  finished_goods_warehouse_id: string;
  owner_id: string;
}

export interface CsrfResponse {
  headerName?: string;
  header_name?: string;
  parameterName?: string;
  parameter_name?: string;
  token: string;
}

const mapCurrentUserToSessionUser = (raw: CurrentUserBackendResponse): SessionUser => {
  return {
    id: raw.userId ?? raw.id ?? crypto.randomUUID(),
    full_name: raw.full_name ?? (raw.email ? raw.email.split("@")[0] : "Người dùng"),
    email: raw.email,
    role: (raw.role?.toLowerCase() as SessionUser["role"]) || "owner",
    permissions: raw.permissions ?? ["*"],
    workspace: raw.workspace ?? {
      id: raw.tenantId ?? "default",
      name: "MakeFlow Workspace",
      branch_name: "Chi nhánh chính",
    },
  };
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCsrf: builder.query<CsrfResponse, void>({
      query: () => "/auth/csrf",
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.token) {
            setCsrfToken(data.token);
          }
        } catch {
          // ignore
        }
      },
    }),
    getSession: builder.query<SessionUser, void>({
      query: () => "/auth/me",
      transformResponse: mapCurrentUserToSessionUser,
      providesTags: ["Session"],
    }),
    login: builder.mutation<SessionUser, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: mapCurrentUserToSessionUser,
      invalidatesTags: ["Session"],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // Spring Security đổi Session ID khi đăng nhập thành công -> hủy CSRF token cũ
          clearCsrfToken();
        } catch {
          // ignore
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Session"],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          clearCsrfToken();
        } catch {
          // ignore
        }
      },
    }),
    provisionWorkspace: builder.mutation<ProvisionWorkspaceResponse, ProvisionWorkspaceRequest>({
      query: (body) => ({
        url: "/setup/workspace",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetCsrfQuery,
  useLazyGetCsrfQuery,
  useGetSessionQuery,
  useLoginMutation,
  useLogoutMutation,
  useProvisionWorkspaceMutation,
} = authApi;
