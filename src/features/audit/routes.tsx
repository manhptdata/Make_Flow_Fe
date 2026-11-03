import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./AuditPage"));
export const auditRoutes = [
  {
    path: "/audit",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Page />
      </Suspense>
    ),
    permission: "audit:read",
  },
];
