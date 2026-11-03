import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./ProcurementPage"));
export const procurementRoutes = [
  {
    path: "/procurement/receipts",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Page />
      </Suspense>
    ),
    permission: "inventory:write",
  },
];
