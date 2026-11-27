import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
import type { AppRoute } from "@/routes/types";

const UnitsPage = lazy(() => import("./UnitsPage"));
const ItemsPage = lazy(() => import("./ItemsPage"));
const ProductsPage = lazy(() => import("./ProductsPage"));

const unitsElement = (
  <Suspense fallback={<LoadingState />}>
    <UnitsPage />
  </Suspense>
);

const itemsElement = (
  <Suspense fallback={<LoadingState />}>
    <ItemsPage />
  </Suspense>
);

const productsElement = (
  <Suspense fallback={<LoadingState />}>
    <ProductsPage />
  </Suspense>
);

export const catalogRoutes: AppRoute[] = [
  { path: "/catalog/units", element: unitsElement, permission: "catalog:read" },
  { path: "/catalog/items", element: itemsElement, permission: "catalog:read" },
  { path: "/catalog/products", element: productsElement, permission: "catalog:read" },
];
