import Decimal from "decimal.js";
import { z } from "zod";
import type { AddProductVariantRequest, InventoryItem, ProductStatus, VariantStatus } from "./types";

/**
 * Schema validate dùng chung cho cả VariantFormModal và từng dòng biến thể trong ProductFormModal.
 * Khớp chặt các ràng buộc DB (V6) và Backend DTO validation.
 */
export const variantFieldSchema = z.object({
  inventory_item_id: z.string().uuid("Vui lòng chọn mặt hàng kho hợp lệ"),
  sku: z
    .string()
    .trim()
    .min(1, "Mã SKU biến thể là bắt buộc")
    .max(20, "SKU tối đa 20 ký tự theo ràng buộc hệ thống")
    .regex(/^[A-Za-z0-9_.-]+$/, "SKU chỉ chứa chữ, số, dấu gạch nối, gạch dưới hoặc chấm"),
  barcode: z
    .string()
    .trim()
    .max(50, "Barcode tối đa 50 ký tự")
    .optional()
    .or(z.literal("")),
  name: z.string().trim().min(1, "Tên biến thể là bắt buộc").max(255, "Tên tối đa 255 ký tự"),
  sale_price: z
    .string()
    .trim()
    .min(1, "Giá bán là bắt buộc")
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) >= 0, "Giá bán phải >= 0"),
  currency: z
    .string()
    .trim()
    .min(1, "Tiền tệ là bắt buộc")
    .max(10, "Mã tiền tệ tối đa 10 ký tự"),
  tax_percent: z
    .string()
    .trim()
    .min(1, "Thuế suất là bắt buộc (nhập 0 nếu không chịu thuế)")
    .refine((val) => {
      const n = Number(val);
      return !Number.isNaN(n) && n >= 0 && n <= 100;
    }, "Thuế suất (%) phải từ 0 đến 100"),
});

export type VariantFieldFormData = z.infer<typeof variantFieldSchema>;

/**
 * Chuẩn hóa dữ liệu form biến thể thành payload gửi API (null hóa barcode rỗng để tránh lỗi CHECK DB).
 */
export function toVariantPayload(data: VariantFieldFormData): AddProductVariantRequest {
  const cleanBarcode = data.barcode?.trim();
  return {
    inventory_item_id: data.inventory_item_id,
    sku: data.sku.trim().toUpperCase(),
    barcode: cleanBarcode ? cleanBarcode : null,
    name: data.name.trim(),
    sale_price: new Decimal(data.sale_price).toDecimalPlaces(4).toNumber(),
    currency: data.currency.trim().toUpperCase(),
    tax_rate: percentToTaxRate(data.tax_percent),
  };
}

/**
 * Chỉ mặt hàng thành phẩm hoặc hàng thương mại đang active mới được gắn vào biến thể bán hàng mới (FR-023).
 */
export function isSellableInventoryItemType(itemType: InventoryItem["item_type"]): boolean {
  return itemType === "finished_good" || itemType === "resale_good";
}

/**
 * Lọc danh sách mặt hàng kho hợp lệ để liên kết với biến thể bán hàng.
 * Giữ lại currentLinkedItemId (nếu có) khi chỉnh sửa biến thể cũ dù mặt hàng liên kết đã ngừng dùng.
 */
export function filterLinkableInventoryItems(
  items: InventoryItem[],
  currentLinkedItemId?: string,
): InventoryItem[] {
  return items.filter(
    (item) =>
      (item.status === "active" && isSellableInventoryItemType(item.item_type)) ||
      (Boolean(currentLinkedItemId) && item.id === currentLinkedItemId),
  );
}

export interface VariantSaleability {
  saleable: boolean;
  reason?: string;
}

/**
 * Xác định điều kiện bán hàng theo đúng quy tắc Backend:
 * Product active + Variant active + Linked InventoryItem active.
 */
export function getVariantSaleability(
  productStatus: ProductStatus,
  variantStatus: VariantStatus,
  linkedItem?: InventoryItem,
): VariantSaleability {
  if (productStatus !== "active") {
    return { saleable: false, reason: "Sản phẩm cha đang ngừng bán" };
  }
  if (variantStatus !== "active") {
    return { saleable: false, reason: "Biến thể đang ngừng bán" };
  }
  if (!linkedItem) {
    return { saleable: false, reason: "Không tìm thấy mặt hàng kho liên kết" };
  }
  if (linkedItem.status !== "active") {
    return { saleable: false, reason: `Mặt hàng kho (${linkedItem.code}) đang ngừng dùng` };
  }
  if (!isSellableInventoryItemType(linkedItem.item_type)) {
    return { saleable: false, reason: "Loại mặt hàng kho không hợp lệ để bán" };
  }
  return { saleable: true };
}

/**
 * Quy đổi % thuế nhập trên UI (VD: 8 hoặc 10) sang tax_rate dạng thập phân (0.08, 0.1) gửi Backend.
 */
export function percentToTaxRate(percentInput: string | number): number {
  const value = new Decimal(percentInput || 0);
  return value.dividedBy(100).toDecimalPlaces(4).toNumber();
}

/**
 * Quy đổi tax_rate (0..1) từ Backend thành chuỗi % hiển thị trên UI (VD: 0.08 -> "8").
 */
export function taxRateToPercentText(taxRate: number | string | null | undefined): string {
  if (taxRate === null || taxRate === undefined || taxRate === "") return "0";
  const pct = new Decimal(taxRate).times(100);
  return pct.toDecimalPlaces(2).toString();
}

/**
 * Tính giá sau thuế phục vụ hiển thị preview.
 */
export function calculatePriceWithTax(
  salePrice: number | string,
  taxRate: number | string | null | undefined,
): number {
  const price = new Decimal(salePrice || 0);
  const rate = new Decimal(taxRate || 0);
  return price.times(new Decimal(1).plus(rate)).toDecimalPlaces(2).toNumber();
}

/**
 * Định dạng tiền tệ hiển thị rõ ràng theo mã tiền tệ.
 */
export function formatMoney(amount: number | string, currency = "VND"): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return `${String(amount)} ${currency}`;
  const upperCurrency = currency.toUpperCase();
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: upperCurrency,
      maximumFractionDigits: upperCurrency === "VND" ? 0 : 2,
    }).format(num);
  } catch {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(num)} ${upperCurrency}`;
  }
}

/**
 * Ngăn máy quét Barcode USB gửi phím Enter làm submit form ngoài ý muốn.
 */
export function preventBarcodeEnterSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    e.preventDefault();
  }
}
