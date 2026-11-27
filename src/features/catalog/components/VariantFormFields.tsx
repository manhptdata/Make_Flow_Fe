import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { Link } from "react-router-dom";
import { Barcode } from "lucide-react";
import { Input, Select } from "@/shared/ui/Field";
import {
  calculatePriceWithTax,
  formatMoney,
  percentToTaxRate,
  preventBarcodeEnterSubmit,
  type VariantFieldFormData,
} from "../productUtils";
import type { InventoryItem } from "../types";

interface VariantFormFieldsProps<TFieldValues extends FieldValues> {
  register: UseFormRegister<TFieldValues>;
  fieldName: (field: keyof VariantFieldFormData) => Path<TFieldValues>;
  errors?: Partial<Record<keyof VariantFieldFormData, { message?: string }>>;
  linkableItems: InventoryItem[];
  previewValues?: {
    sale_price?: string;
    currency?: string;
    tax_percent?: string;
  };
  showRelinkHint?: boolean;
}

const itemTypeLabels: Record<InventoryItem["item_type"], string> = {
  material: "Nguyên liệu",
  packaging: "Bao bì",
  finished_good: "Thành phẩm",
  resale_good: "Hàng thương mại",
};

/**
 * Bộ trường nhập liệu dùng chung cho Biến thể bán hàng (SKU, Barcode, Mặt hàng kho, Giá, Thuế).
 */
export function VariantFormFields<TFieldValues extends FieldValues>({
  register,
  fieldName,
  errors,
  linkableItems,
  previewValues,
  showRelinkHint = false,
}: VariantFormFieldsProps<TFieldValues>) {
  const numericPrice = Number(previewValues?.sale_price ?? 0);
  const numericTaxPct = Number(previewValues?.tax_percent ?? 0);
  const showPricePreview =
    !Number.isNaN(numericPrice) &&
    numericPrice >= 0 &&
    !Number.isNaN(numericTaxPct) &&
    numericTaxPct >= 0 &&
    numericTaxPct <= 100;

  const grossPrice = showPricePreview
    ? calculatePriceWithTax(numericPrice, percentToTaxRate(numericTaxPct))
    : 0;

  return (
    <div className="space-y-3">
      <div>
        <Select label="Mặt hàng kho liên kết *" {...register(fieldName("inventory_item_id"))}>
          {linkableItems.length === 0 ? (
            <option value="">-- Chưa có mặt hàng thành phẩm / thương mại đang dùng --</option>
          ) : (
            linkableItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.code}] {item.name} — {itemTypeLabels[item.item_type] ?? item.item_type}
                {item.status === "inactive" ? " (Đang ngừng dùng)" : ""}
              </option>
            ))
          )}
        </Select>
        {errors?.inventory_item_id?.message && (
          <span className="mt-1 block text-xs text-rose-600">{errors.inventory_item_id.message}</span>
        )}
        {linkableItems.length === 0 ? (
          <p className="mt-1.5 text-xs text-amber-700">
            Biến thể chỉ liên kết được với mặt hàng kho loại <strong>Thành phẩm</strong> hoặc{" "}
            <strong>Hàng thương mại</strong> đang hoạt động.{" "}
            <Link to="/catalog/items" className="font-semibold underline hover:text-amber-900">
              Tạo mặt hàng kho tại đây
            </Link>
            .
          </p>
        ) : showRelinkHint ? (
          <p className="mt-1 text-xs text-slate-500">
            Lưu ý: Không thể đổi mặt hàng kho nếu biến thể đã phát sinh đơn hàng hoặc giao dịch.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Mã SKU biến thể *"
          placeholder="VD: BML-M, CAKE-20CM, NUOC-500"
          maxLength={20}
          {...register(fieldName("sku"))}
          error={errors?.sku?.message}
        />

        <label className="block text-sm font-medium text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <Barcode className="h-3.5 w-3.5 text-slate-400" />
            Barcode (Mã vạch — tùy chọn)
          </span>
          <input
            className="field mt-1.5 font-mono"
            placeholder="Quét hoặc nhập mã vạch (tối đa 50 ký tự)"
            maxLength={50}
            onKeyDown={preventBarcodeEnterSubmit}
            {...register(fieldName("barcode"))}
          />
          {errors?.barcode?.message && (
            <span className="mt-1 block text-xs text-rose-600">{errors.barcode.message}</span>
          )}
        </label>
      </div>

      <Input
        label="Tên biến thể *"
        placeholder="VD: Size M, Hộp 6 chiếc, Chai 500ml, Mặc định..."
        {...register(fieldName("name"))}
        error={errors?.name?.message}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          label="Giá bán (trước thuế) *"
          type="number"
          min="0"
          step="any"
          placeholder="0"
          {...register(fieldName("sale_price"))}
          error={errors?.sale_price?.message}
        />

        <Input
          label="Tiền tệ *"
          placeholder="VND"
          maxLength={10}
          {...register(fieldName("currency"))}
          error={errors?.currency?.message}
        />

        <Input
          label="Thuế VAT (%) *"
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="0"
          {...register(fieldName("tax_percent"))}
          error={errors?.tax_percent?.message}
        />
      </div>

      {showPricePreview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span>
            Hệ số thuế gửi hệ thống:{" "}
            <code className="font-mono font-semibold text-slate-800">
              {percentToTaxRate(numericTaxPct)}
            </code>
          </span>
          <span>
            Giá sau thuế ước tính:{" "}
            <strong className="text-sky-700">
              {formatMoney(grossPrice, previewValues?.currency || "VND")}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
