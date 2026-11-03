import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
import type { AppRoute } from "@/routes/types";

const Page = lazy(() => import("./CatalogPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const catalogRoutes: AppRoute[] = ["/catalog/units", "/catalog/items", "/catalog/products"].map(
  (path) => ({ path, element, permission: "catalog:read" }),
);
