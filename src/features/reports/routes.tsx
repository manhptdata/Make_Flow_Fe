import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./ReportsPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const reportRoutes = ["/reports/inventory", "/reports/quality", "/reports/gross-profit"].map(
  (path) => ({ path, element, permission: "reports:read" }),
);
