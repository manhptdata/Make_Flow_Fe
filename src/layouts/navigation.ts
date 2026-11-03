import {
  Boxes,
  ClipboardList,
  Factory,
  Gauge,
  ListChecks,
  PackagePlus,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  Warehouse,
  Wheat,
} from "lucide-react";

export const navigation = [
  { label: "Tổng quan", items: [{ label: "Dashboard", to: "/dashboard", icon: Gauge }] },
  {
    label: "Danh mục",
    items: [
      { label: "Đơn vị tính", to: "/catalog/units", icon: SlidersHorizontal },
      { label: "Nguyên liệu", to: "/catalog/items", icon: Wheat },
      { label: "Sản phẩm", to: "/catalog/products", icon: Boxes },
      { label: "Công thức", to: "/recipes", icon: ListChecks },
    ],
  },
  {
    label: "Kho",
    items: [
      { label: "Phiếu nhập", to: "/procurement/receipts", icon: PackagePlus },
      { label: "Tồn kho", to: "/inventory/balances", icon: Warehouse },
      { label: "Sổ kho", to: "/inventory/movements", icon: ClipboardList },
      { label: "Điều chỉnh", to: "/inventory/adjustments", icon: SlidersHorizontal },
    ],
  },
  {
    label: "Sản xuất",
    items: [
      { label: "Ước tính", to: "/estimates", icon: ListChecks },
      { label: "Lệnh sản xuất", to: "/production", icon: Factory },
    ],
  },
  {
    label: "Bán hàng",
    items: [
      { label: "Mở POS", to: "/pos", icon: ShoppingCart },
      { label: "Đơn hàng", to: "/sales/orders", icon: ReceiptText },
    ],
  },
  {
    label: "Phân tích",
    items: [
      { label: "Tồn kho", to: "/reports/inventory", icon: Warehouse },
      { label: "Chất lượng", to: "/reports/quality", icon: ShieldCheck },
      { label: "Lợi nhuận gộp", to: "/reports/gross-profit", icon: Gauge },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { label: "Người dùng", to: "/admin/users", icon: Users },
      { label: "Vai trò", to: "/admin/roles", icon: ShieldCheck },
      { label: "Thiết lập", to: "/admin/settings", icon: Settings },
      { label: "Nhật ký", to: "/audit", icon: ClipboardList },
      { label: "Công việc nền", to: "/jobs", icon: ListChecks },
      { label: "Nhập dữ liệu", to: "/imports", icon: PackagePlus },
    ],
  },
] as const;
