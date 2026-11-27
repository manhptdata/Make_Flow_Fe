export type Dimension = "mass" | "volume" | "count";
export type UnitStatus = "active" | "inactive";

export interface Unit {
  id: string;
  code: string;
  name: string;
  symbol: string;
  dimension: Dimension;
  ratio_to_base: string;
  scale: number;
  is_base?: boolean;
  base?: boolean;
  status: UnitStatus;
  created_at?: string;
  updated_at?: string;
  version: number;
  // Hỗ trợ linh hoạt
  ratioToBase?: string;
  isBase?: boolean;
}

export interface CreateUnitRequest {
  code: string;
  name: string;
  symbol: string;
  dimension: Dimension;
  ratio_to_base: string;
  scale: number;
  is_base: boolean;
  base?: boolean;
}

export interface UpdateUnitRequest {
  name: string;
  symbol: string;
  ratio_to_base: string;
  scale: number;
  is_base: boolean;
  base?: boolean;
  version: number;
}

export interface ConversionPreviewRequest {
  source_unit_id: string;
  target_unit_id: string;
  quantity: string;
}

export interface ConversionPreviewResponse {
  source_unit_id: string;
  source_unit_code: string;
  target_unit_id: string;
  target_unit_code: string;
  entered_quantity: string;
  converted_quantity: string;
  // Fallbacks
  sourceUnitCode?: string;
  targetUnitCode?: string;
  enteredQuantity?: string;
  convertedQuantity?: string;
}

export interface UnitFilterQuery {
  dimension?: Dimension;
  status?: UnitStatus;
}

// ----------------------------------------------------
// Inventory Item & Item-specific UOM (Work package 009)
// ----------------------------------------------------

export type ItemType = "material" | "packaging" | "finished_good" | "resale_good";
export type ItemStatus = "active" | "inactive";

export interface InventoryItemUnit {
  id: string;
  unit_id: string;
  factor_to_item_base: string | number;
  status: ItemStatus;
  created_at?: string;
  updated_at?: string;
  version: number;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  item_type: ItemType;
  base_unit_id: string;
  status: ItemStatus;
  item_units: InventoryItemUnit[];
  created_at?: string;
  updated_at?: string;
  version: number;
}

export interface CreateInventoryItemRequest {
  code: string;
  name: string;
  item_type: ItemType;
  base_unit_id: string;
}

export interface UpdateInventoryItemRequest {
  name: string;
  item_type: ItemType;
  base_unit_id: string;
  version: number;
}

export interface AddInventoryItemUnitRequest {
  unit_id: string;
  factor_to_item_base: string | number;
}

export interface PreviewItemConversionRequest {
  package_unit_id: string;
  entered_quantity: string | number;
}

export interface PreviewItemConversionResponse {
  item_id: string;
  package_unit_id: string;
  entered_quantity: string | number;
  base_unit_id: string;
  converted_base_quantity: string | number;
}

export interface InventoryItemFilterQuery {
  type?: ItemType;
  status?: ItemStatus;
  search?: string;
}

// ----------------------------------------------------
// Product & Sellable Variant (Work package 010)
// ----------------------------------------------------

export type ProductStatus = "active" | "inactive";
export type VariantStatus = "active" | "inactive";

export interface ProductVariant {
  id: string;
  product_id: string;
  inventory_item_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  sale_price: number | string;
  currency: string;
  tax_rate: number | string | null;
  status: VariantStatus;
  created_at?: string;
  updated_at?: string;
  version: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  status: ProductStatus;
  variants: ProductVariant[];
  created_at?: string;
  updated_at?: string;
  version: number;
}

export interface AddProductVariantRequest {
  inventory_item_id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  sale_price: number;
  currency: string;
  tax_rate: number;
}

export interface CreateProductRequest {
  code: string;
  name: string;
  variants: AddProductVariantRequest[];
}

export interface UpdateProductRequest {
  code: string;
  name: string;
  version: number;
}

export interface UpdateProductVariantRequest {
  inventory_item_id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  sale_price: number;
  currency: string;
  tax_rate: number;
  version: number;
}

export interface ProductFilterQuery {
  status?: ProductStatus;
  search?: string;
}
