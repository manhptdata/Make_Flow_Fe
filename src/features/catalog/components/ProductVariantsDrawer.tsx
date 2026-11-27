import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  Edit,
  Plus,
  Power,
  PowerOff,
  Tag,
} from "lucide-react";
import { Drawer } from "@/shared/ui/Drawer";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useActivateProductVariantMutation,
  useDeactivateProductVariantMutation,
  useGetInventoryItemsQuery,
  useGetProductByIdQuery,
} from "../api";
import {
  calculatePriceWithTax,
  formatMoney,
  getVariantSaleability,
  taxRateToPercentText,
} from "../productUtils";
import type { Product, ProductVariant } from "../types";
import { VariantFormModal } from "./VariantFormModal";

interface ProductVariantsDrawerProps {
  open: boolean;
  onClose: () => void;
  product: Product;
}

export function ProductVariantsDrawer({ open, onClose, product }: ProductVariantsDrawerProps) {
  const { data: latestProduct = product } = useGetProductByIdQuery(product.id, {
    skip: !product.id,
  });
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const [activateVariant, activateState] = useActivateProductVariantMutation();
  const [deactivateVariant, deactivateState] = useDeactivateProductVariantMutation();

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | undefined>(undefined);

  const inventoryMap = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );

  const handleOpenAdd = () => {
    setEditingVariant(undefined);
    setVariantModalOpen(true);
  };

  const handleOpenEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setVariantModalOpen(true);
  };

  const handleToggleVariantStatus = async (variant: ProductVariant) => {
    try {
      if (variant.status === "active") {
        await deactivateVariant({
          productId: latestProduct.id,
          variantId: variant.id,
        }).unwrap();
      } else {
        await activateVariant({
          productId: latestProduct.id,
          variantId: variant.id,
        }).unwrap();
      }
    } catch {
      // Problem banner displays API error
    }
  };

  const actionError = activateState.error ?? deactivateState.error;
  const actionProblem = actionError ? toProblemDetail(actionError) : undefined;
  const variants = latestProduct.variants ?? [];

  return (
    <>
      <Drawer
        open={open}
        title={`Biến thể sản phẩm: ${latestProduct.code}`}
        onClose={onClose}
      >
        <div className="space-y-5">
          {/* Thông tin sản phẩm cha */}
          <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                  Sản phẩm gốc
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">{latestProduct.name}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-600">Mã: {latestProduct.code}</p>
              </div>
              <Badge status={latestProduct.status} />
            </div>
            {latestProduct.status !== "active" && (
              <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-amber-100/70 px-2.5 py-1.5 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Sản phẩm cha đang ngừng bán nên toàn bộ biến thể bên dưới chưa thể bán tại POS.
              </p>
            )}
          </div>

          {actionProblem && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700" role="alert">
              <p className="font-semibold">{actionProblem.title}</p>
              <p className="mt-0.5">{actionProblem.detail}</p>
            </div>
          )}

          {/* Header danh sách biến thể */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách biến thể ({variants.length})
            </h3>
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              Thêm biến thể
            </Button>
          </div>

          {/* Danh sách biến thể */}
          {variants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Sản phẩm này chưa có biến thể bán hàng nào.
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((variant) => {
                const linkedItem = inventoryMap.get(variant.inventory_item_id);
                const saleability = getVariantSaleability(
                  latestProduct.status,
                  variant.status,
                  linkedItem,
                );
                const taxPct = taxRateToPercentText(variant.tax_rate);
                const grossPrice = calculatePriceWithTax(variant.sale_price, variant.tax_rate);

                return (
                  <div
                    key={variant.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{variant.name}</span>
                          <Badge status={variant.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono font-semibold text-slate-700">
                            <Tag className="h-3 w-3" /> {variant.sku}
                          </span>
                          {variant.barcode && (
                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-600">
                              <Barcode className="h-3 w-3" /> {variant.barcode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Sửa biến thể"
                          onClick={() => handleOpenEdit(variant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title={variant.status === "active" ? "Ngừng bán biến thể" : "Kích hoạt biến thể"}
                          disabled={activateState.isLoading || deactivateState.isLoading}
                          onClick={() => handleToggleVariantStatus(variant)}
                          className={
                            variant.status === "active"
                              ? "text-amber-600 hover:text-amber-700"
                              : "text-emerald-600 hover:text-emerald-700"
                          }
                        >
                          {variant.status === "active" ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Giá & Thuế */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                      <div>
                        <span className="text-slate-500">Giá bán (chưa thuế)</span>
                        <p className="mt-0.5 font-bold text-slate-900">
                          {formatMoney(variant.sale_price, variant.currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Thuế VAT ({taxPct}%)</span>
                        <p className="mt-0.5 font-semibold text-sky-700">
                          Sau thuế: {formatMoney(grossPrice, variant.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Liên kết kho & Trạng thái Saleable */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600">
                        Kho:{" "}
                        <strong className="text-slate-800">
                          {linkedItem ? `${linkedItem.name} (${linkedItem.code})` : "Đang tải…"}
                        </strong>
                      </span>

                      {saleability.saleable ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Có thể bán
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700"
                          title={saleability.reason}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> {saleability.reason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>

      {variantModalOpen && (
        <VariantFormModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          productId={latestProduct.id}
          productName={latestProduct.name}
          variant={editingVariant}
        />
      )}
    </>
  );
}
