import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { AuthGuard, PermissionGuard } from "@/routes/guards";
import { dashboardRoutes } from "@/features/dashboard/routes";
import { catalogRoutes } from "@/features/catalog/routes";
import { recipeRoutes } from "@/features/recipes/routes";
import { procurementRoutes } from "@/features/procurement/routes";
import { inventoryRoutes } from "@/features/inventory/routes";
import { productionRoutes } from "@/features/production/routes";
import { salesRoutes } from "@/features/sales/routes";
import { adminRoutes } from "@/features/admin/routes";
import { reportRoutes } from "@/features/reports/routes";
import { auditRoutes } from "@/features/audit/routes";
import { jobRoutes } from "@/features/jobs/routes";
import { posRoutes } from "@/features/pos/routes";
import { ErrorState, LoadingState } from "@/shared/ui/PageState";

const LoginPage = lazy(() => import("@/features/auth/LoginPage"));
const SetupPage = lazy(() => import("@/features/admin/WorkspaceSetupPage"));
const shellRoutes = [
  ...dashboardRoutes,
  ...catalogRoutes,
  ...recipeRoutes,
  ...procurementRoutes,
  ...inventoryRoutes,
  ...productionRoutes,
  ...salesRoutes,
  ...adminRoutes,
  ...reportRoutes,
  ...auditRoutes,
  ...jobRoutes,
];

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoadingState />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/setup/workspace"
        element={
          <Suspense fallback={<LoadingState />}>
            <SetupPage />
          </Suspense>
        }
      />
      <Route element={<AuthGuard />}>
        <Route
          path="/pos"
          element={
            <PermissionGuard permission={posRoutes[0].permission}>{posRoutes[0].element}</PermissionGuard>
          }
        />
        <Route element={<AppShell />}>
          {shellRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<PermissionGuard permission={route.permission}>{route.element}</PermissionGuard>}
            />
          ))}
          <Route
            path="/forbidden"
            element={
              <ErrorState
                problem={{
                  title: "Không có quyền truy cập",
                  status: 403,
                  detail: "Tài khoản của bạn không được cấp quyền cho chức năng này.",
                  code: "ACCESS_DENIED",
                }}
              />
            }
          />
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <ErrorState
            problem={{
              title: "Không tìm thấy trang",
              status: 404,
              detail: "Đường dẫn không tồn tại hoặc đã được chuyển.",
              code: "PAGE_NOT_FOUND",
            }}
          />
        }
      />
    </Routes>
  );
}
