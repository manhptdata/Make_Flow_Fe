import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./InventoryPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const inventoryRoutes = ["/inventory/balances", "/inventory/movements", "/inventory/adjustments"].map(
  (path) => ({ path, element, permission: "inventory:read" }),
);
