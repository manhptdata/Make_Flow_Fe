import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./AdminPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const adminRoutes = ["/admin/users", "/admin/roles", "/admin/settings"].map((path) => ({
  path,
  element,
  permission: "admin:read",
}));
