import { Fragment, useMemo, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Power,
  PowerOff,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useActivateProductMutation,
  useActivateProductVariantMutation,
  useDeactivateProductMutation,
  useDeactivateProductVariantMutation,
  useGetInventoryItemsQuery,
  useGetProductsQuery,
} from "./api";
import {
  calculatePriceWithTax,
  formatMoney,
  getVariantSaleability,
  preventBarcodeEnterSubmit,
  taxRateToPercentText,
} from "./productUtils";
import { ProductFormModal } from "./components/ProductFormModal";
import { ProductVariantsDrawer } from "./components/ProductVariantsDrawer";
import { VariantFormModal } from "./components/VariantFormModal";
import type { InventoryItem, Product, ProductStatus, ProductVariant } from "./types";

type SaleableFilter = "" | "saleable" | "not_saleable";

const linkedItemTypeLabels: Record<InventoryItem["item_type"], string> = {
  material: "Nguyên liệu",
  packaging: "Bao bì",
  finished_good: "Thành phẩm",
  resale_good: "Thương mại",
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [saleableFilter, setSaleableFilter] = useState<SaleableFilter>("");
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

  // Modal & Drawer state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [drawerProduct, setDrawerProduct] = useState<Product | undefined>(undefined);
  const [quickVariantTarget, setQuickVariantTarget] = useState<
    { product: Product; variant?: ProductVariant } | undefined
  >(undefined);

  // Queries & Mutations
  const {
    data: products = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetProductsQuery(statusFilter ? { status: statusFilter } : undefined);

  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const [activateProduct, activateProductState] = useActivateProductMutation();
  const [deactivateProduct, deactivateProductState] = useDeactivateProductMutation();
  const [activateVariant, activateVariantState] = useActivateProductVariantMutation();
  const [deactivateVariant, deactivateVariantState] = useDeactivateProductVariantMutation();

  const inventoryMap = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );

  // Tìm kiếm đa năng (tên SP, mã SP, SKU biến thể, chính xác Barcode) & lọc điều kiện bán
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const variants = product.variants ?? [];

      const matchesSearch =
        !q ||
        product.code.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            v.name.toLowerCase().includes(q) ||
            (v.barcode ? v.barcode.toLowerCase() === q || v.barcode.toLowerCase().includes(q) : false),
        );

      if (!matchesSearch) return false;

      if (saleableFilter === "saleable") {
        return variants.some(
          (v) =>
            getVariantSaleability(product.status, v.status, inventoryMap.get(v.inventory_item_id))
              .saleable,
        );
      }

      if (saleableFilter === "not_saleable") {
        return (
          variants.length === 0 ||
          variants.some(
            (v) =>
              !getVariantSaleability(
                product.status,
                v.status,
                inventoryMap.get(v.inventory_item_id),
              ).saleable,
          )
        );
      }

      return true;
    });
  }, [products, search, saleableFilter, inventoryMap]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    let totalVariants = 0;
    let saleableVariants = 0;

    for (const p of products) {
      for (const v of p.variants ?? []) {
        totalVariants += 1;
        if (getVariantSaleability(p.status, v.status, inventoryMap.get(v.inventory_item_id)).saleable) {
          saleableVariants += 1;
        }
      }
    }

    return {
      totalProducts: products.length,
      totalVariants,
      saleableVariants,
      nonSaleableVariants: totalVariants - saleableVariants,
    };
  }, [products, inventoryMap]);

  const isExpanded = (productId: string) => expandedOverrides[productId] ?? true;

  const toggleExpand = (productId: string) => {
    setExpandedOverrides((prev) => ({
      ...prev,
      [productId]: !(prev[productId] ?? true),
    }));
  };

  const handleToggleProductStatus = async (product: Product) => {
    try {
      if (product.status === "active") {
        await deactivateProduct(product.id).unwrap();
      } else {
        await activateProduct(product.id).unwrap();
      }
    } catch {
      // Action problem banner handles notification
    }
  };

  const handleToggleVariantStatus = async (productId: string, variant: ProductVariant) => {
    try {
      if (variant.status === "active") {
        await deactivateVariant({ productId, variantId: variant.id }).unwrap();
      } else {
        await activateVariant({ productId, variantId: variant.id }).unwrap();
      }
    } catch {
      // Action problem banner handles notification
    }
  };

  const actionError =
    activateProductState.error ??
    deactivateProductState.error ??
    activateVariantState.error ??
    deactivateVariantState.error;
  const actionProblem = actionError ? toProblemDetail(actionError) : undefined;

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Quản lý Danh mục
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
            Sản phẩm & Biến thể bán hàng
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Quản lý danh mục sản phẩm bán ra tại POS, SKU, mã vạch (Barcode), giá bán, thuế VAT và liên kết mặt hàng kho thành phẩm / hàng thương mại.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              setEditingProduct(undefined);
              setProductModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo sản phẩm
          </Button>
        </div>
      </header>

      {/* Summary KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Tổng sản phẩm</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-slate-500">Tổng biến thể (SKU)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalVariants}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-emerald-700">Đủ điều kiện bán</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.saleableVariants}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-amber-700">Ngừng / Chưa bán được</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{stats.nonSaleableVariants}</p>
        </div>
      </div>

      {actionProblem && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700" role="alert">
          <p className="font-semibold">{actionProblem.title}</p>
          <p className="mt-0.5">{actionProblem.detail}</p>
        </div>
      )}

      {/* Main Card */}
      <div className="card overflow-hidden">
        {/* Filters & Barcode Search */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="field pl-9 pr-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={preventBarcodeEnterSubmit}
                placeholder="Tìm tên SP, mã SP, SKU hoặc quét Barcode…"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Lọc trạng thái sản phẩm"
                className="field text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProductStatus | "")}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang bán (active)</option>
                <option value="inactive">Ngừng bán (inactive)</option>
              </select>

              <select
                aria-label="Lọc điều kiện bán hàng"
                className="field text-sm"
                value={saleableFilter}
                onChange={(e) => setSaleableFilter(e.target.value as SaleableFilter)}
              >
                <option value="">Mọi điều kiện bán</option>
                <option value="saleable">Đang bán được (Saleable)</option>
                <option value="not_saleable">Chưa đủ điều kiện bán</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {isFetching ? "Đang đồng bộ…" : `${filteredProducts.length} sản phẩm`}
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState problem={toProblemDetail(error)} onRetry={refetch} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Chưa có sản phẩm bán hàng nào phù hợp"
              action={
                <Button
                  onClick={() => {
                    setEditingProduct(undefined);
                    setProductModalOpen(true);
                  }}
                >
                  Tạo sản phẩm đầu tiên
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3">Mã SP</th>
                  <th className="px-4 py-3">Tên sản phẩm</th>
                  <th className="px-4 py-3">Biến thể & Khả dụng</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const variants = product.variants ?? [];
                  const expanded = isExpanded(product.id);
                  const saleableCount = variants.filter(
                    (v) =>
                      getVariantSaleability(
                        product.status,
                        v.status,
                        inventoryMap.get(v.inventory_item_id),
                      ).saleable,
                  ).length;

                  return (
                    <Fragment key={product.id}>
                      <tr className="bg-white transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            aria-label={expanded ? "Thu gọn biến thể" : "Mở rộng biến thể"}
                            onClick={() => toggleExpand(product.id)}
                            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            {expanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-sky-700">
                          {product.code}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {product.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setDrawerProduct(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Boxes className="h-3.5 w-3.5" />
                            {variants.length} biến thể ({saleableCount} có thể bán)
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge status={product.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Thêm biến thể nhanh"
                              onClick={() => setQuickVariantTarget({ product })}
                            >
                              <Plus className="h-4 w-4 text-sky-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Sửa thông tin sản phẩm"
                              onClick={() => {
                                setEditingProduct(product);
                                setProductModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title={product.status === "active" ? "Ngừng bán sản phẩm" : "Kích hoạt sản phẩm"}
                              disabled={
                                activateProductState.isLoading || deactivateProductState.isLoading
                              }
                              onClick={() => handleToggleProductStatus(product)}
                              className={
                                product.status === "active"
                                  ? "text-amber-600 hover:text-amber-700"
                                  : "text-emerald-600 hover:text-emerald-700"
                              }
                            >
                              {product.status === "active" ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Nested Variants Table */}
                      {expanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={6} className="px-6 py-3">
                            {variants.length === 0 ? (
                              <p className="py-2 text-xs italic text-slate-400">
                                Chưa có biến thể nào. Bấm "+" để thêm biến thể đầu tiên.
                              </p>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
                                    <tr>
                                      <th className="px-3.5 py-2">SKU / Barcode</th>
                                      <th className="px-3.5 py-2">Tên biến thể</th>
                                      <th className="px-3.5 py-2">Mặt hàng kho liên kết</th>
                                      <th className="px-3.5 py-2">Giá bán & VAT</th>
                                      <th className="px-3.5 py-2">Trạng thái bán</th>
                                      <th className="px-3.5 py-2 text-right">Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {variants.map((variant) => {
                                      const linkedItem = inventoryMap.get(variant.inventory_item_id);
                                      const saleability = getVariantSaleability(
                                        product.status,
                                        variant.status,
                                        linkedItem,
                                      );
                                      const taxPct = taxRateToPercentText(variant.tax_rate);
                                      const grossPrice = calculatePriceWithTax(
                                        variant.sale_price,
                                        variant.tax_rate,
                                      );

                                      return (
                                        <tr key={variant.id} className="hover:bg-slate-50/50">
                                          <td className="px-3.5 py-2.5">
                                            <div className="flex flex-col gap-0.5">
                                              <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800">
                                                <Tag className="h-3 w-3 text-slate-400" />
                                                {variant.sku}
                                              </span>
                                              {variant.barcode ? (
                                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                                  <Barcode className="h-3 w-3 text-slate-400" />
                                                  {variant.barcode}
                                                </span>
                                              ) : (
                                                <span className="text-[11px] text-slate-400">
                                                  Chưa có barcode
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                                            {variant.name}
                                          </td>
                                          <td className="px-3.5 py-2.5">
                                            {linkedItem ? (
                                              <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-slate-800">
                                                  {linkedItem.name}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                  {linkedItem.code} ·{" "}
                                                  {linkedItemTypeLabels[linkedItem.item_type] ??
                                                    linkedItem.item_type}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="font-mono text-slate-400">
                                                {variant.inventory_item_id}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3.5 py-2.5">
                                            <div className="font-bold text-slate-900">
                                              {formatMoney(variant.sale_price, variant.currency)}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                              VAT {taxPct}% · Sau thuế:{" "}
                                              <span className="font-semibold text-sky-700">
                                                {formatMoney(grossPrice, variant.currency)}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-3.5 py-2.5">
                                            {saleability.saleable ? (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                                                <CheckCircle2 className="h-3 w-3" /> Có thể bán
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                                                <AlertTriangle className="h-3 w-3" />{" "}
                                                {saleability.reason}
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-3.5 py-2.5 text-right">
                                            <div className="inline-flex items-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title={`Sửa biến thể ${variant.sku}`}
                                                onClick={() =>
                                                  setQuickVariantTarget({ product, variant })
                                                }
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                title={
                                                  variant.status === "active"
                                                    ? `Ngừng bán biến thể ${variant.sku}`
                                                    : `Kích hoạt biến thể ${variant.sku}`
                                                }
                                                disabled={
                                                  activateVariantState.isLoading ||
                                                  deactivateVariantState.isLoading
                                                }
                                                onClick={() =>
                                                  handleToggleVariantStatus(product.id, variant)
                                                }
                                                className={
                                                  variant.status === "active"
                                                    ? "text-amber-600 hover:text-amber-700"
                                                    : "text-emerald-600 hover:text-emerald-700"
                                                }
                                              >
                                                {variant.status === "active" ? (
                                                  <PowerOff className="h-3.5 w-3.5" />
                                                ) : (
                                                  <Power className="h-3.5 w-3.5" />
                                                )}
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tạo / sửa sản phẩm */}
      {productModalOpen && (
        <ProductFormModal
          open={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          product={editingProduct}
        />
      )}

      {/* Drawer quản lý biến thể chuyên sâu */}
      {drawerProduct && (
        <ProductVariantsDrawer
          open={Boolean(drawerProduct)}
          onClose={() => setDrawerProduct(undefined)}
          product={drawerProduct}
        />
      )}

      {/* Modal thêm / sửa nhanh 1 biến thể từ bảng */}
      {quickVariantTarget && (
        <VariantFormModal
          open={Boolean(quickVariantTarget)}
          onClose={() => setQuickVariantTarget(undefined)}
          productId={quickVariantTarget.product.id}
          productName={quickVariantTarget.product.name}
          variant={quickVariantTarget.variant}
        />
      )}
    </section>
  );
}
