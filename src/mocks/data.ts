import type { ListItem, SessionUser } from "@/shared/types/api";

const now = new Date().toISOString();
const item = (
  code: string,
  name: string,
  description: string,
  quantity?: string,
  unit?: string,
  amount?: string,
  status: ListItem["status"] = "active",
): ListItem => ({
  id: crypto.randomUUID(),
  code,
  name,
  description,
  quantity,
  unit,
  amount,
  status,
  updated_at: now,
});

export const sessionUser: SessionUser = {
  id: "019a4d89-6c49-7da3-8120-001122334455",
  full_name: "Nguyễn Minh",
  email: "owner@makeflow.local",
  role: "owner",
  permissions: ["*"],
  workspace: {
    id: "019a4d89-6c49-7da3-8120-667788990011",
    name: "MakeFlow Demo",
    branch_name: "Cửa hàng trung tâm",
  },
};

const catalogUnits = [
  item("KG", "Kilogram", "Đơn vị khối lượng cơ sở"),
  item("G", "Gram", "1 kg = 1.000 g"),
  item("PCS", "Chiếc", "Đơn vị đếm thành phẩm"),
];
const catalogItems = [
  item("NL-BOT-01", "Bột mì số 13", "Nguyên liệu chính", "12.5", "kg", "312500"),
  item("NL-BO-01", "Bơ lạt", "Bảo quản mát", "8.2", "kg", "1476000"),
  item("NL-DUONG", "Đường trắng", "Nguyên liệu", "25", "kg", "750000"),
];
const catalogProducts = [
  item("SP-BMB-01", "Bánh mì bơ", "Thành phẩm bán tại quầy", "96", "chiếc", "1728000"),
  item("SP-BSC-01", "Bánh sừng bò", "Thành phẩm", "42", "chiếc", "1260000"),
  item("SP-BQN-01", "Bánh quy nguyên cám", "Gói 200 g", "28", "gói", "980000"),
];

export const resources: Record<string, ListItem[]> = {
  "catalog/units": catalogUnits,
  "catalog/items": catalogItems,
  "catalog/products": catalogProducts,
  recipes: [
    item(
      "CT-BMB-V3",
      "Bánh mì bơ · Phiên bản 3",
      "5 kg bột cho 100 chiếc",
      undefined,
      undefined,
      "365000",
      "active",
    ),
    item(
      "CT-BSC-V2",
      "Bánh sừng bò · Phiên bản 2",
      "Công thức đang áp dụng",
      undefined,
      undefined,
      "620000",
      "active",
    ),
  ],
  "production/estimates": [
    item(
      "EST-0021",
      "Ước tính Bánh mì bơ",
      "Tối đa 250 chiếc · Giới hạn bởi bơ lạt",
      "250",
      "chiếc",
      "912500",
      "completed",
    ),
  ],
  "inventory/receipts": [
    item("GR-0026", "Nhập nguyên liệu Minh Phát", "3 dòng nguyên liệu", "75", "kg", "2850000", "draft"),
    item("GR-0025", "Nhập bột và đường", "Đã ghi sổ", "120", "kg", "3960000", "posted"),
  ],
  "inventory/balances": [...catalogItems, ...catalogProducts],
  "inventory/movements": [
    item("MOV-0089", "Nhập kho từ GR-0025", "Bột mì +50 kg", "50", "kg", "1250000", "posted"),
    item("MOV-0090", "Tiêu hao cho WO-0018", "Bột mì -5 kg", "-5", "kg", "125000", "posted"),
  ],
  "inventory/adjustments": [
    item("ADJ-0004", "Điều chỉnh kiểm kê tháng 10", "Lệch thực tế 0,5 kg", "-0.5", "kg", "12500", "posted"),
  ],
  "production/batches": [
    item(
      "WO-0018",
      "Sản xuất Bánh mì bơ",
      "100 kế hoạch · 96 đạt · 4 hỏng",
      "100",
      "chiếc",
      "365000",
      "rejected",
    ),
    item("WO-0019", "Sản xuất Bánh sừng bò", "Đang thực hiện", "60", "chiếc", "620000", "pending"),
  ],
  "sales/orders": [
    item("SO-0109", "Đơn tại quầy #0109", "Tiền mặt · 3 sản phẩm", "3", "sản phẩm", "105000", "completed"),
    item("SO-0108", "Đơn tại quầy #0108", "Chuyển khoản", "2", "sản phẩm", "65000", "completed"),
  ],
  "admin/users": [
    item(
      "USR-001",
      "Nguyễn Minh",
      "Chủ cửa hàng · owner@makeflow.local",
      undefined,
      undefined,
      undefined,
      "active",
    ),
    item("USR-002", "Trần Lan", "Nhân viên sản xuất", undefined, undefined, undefined, "active"),
  ],
  "admin/roles": [
    item("ROLE-OWNER", "Chủ cửa hàng", "Toàn quyền"),
    item("ROLE-PRODUCER", "Nhân viên sản xuất", "Xem và hoàn thành lệnh sản xuất"),
    item("ROLE-CASHIER", "Thu ngân", "Bán hàng tại POS"),
  ],
  "admin/settings": [
    item("SET-CURRENCY", "Tiền tệ cơ sở", "VND"),
    item("SET-TIMEZONE", "Múi giờ", "Asia/Ho_Chi_Minh"),
    item("SET-COST", "Phương pháp giá vốn", "Bình quân di động"),
  ],
  "reports/inventory": [
    item(
      "RPT-STOCK-01",
      "Bột mì sắp dưới tồn tối thiểu",
      "12,5 kg · Ngưỡng 15 kg",
      "12.5",
      "kg",
      "312500",
      "pending",
    ),
  ],
  "reports/quality": [
    item(
      "RPT-QUALITY-01",
      "Bánh mì bơ · Tháng 10",
      "1.240 đạt · 38 hỏng · 2,97%",
      "38",
      "chiếc",
      "144476",
      "rejected",
    ),
  ],
  "reports/gross-profit": [
    item(
      "RPT-GP-01",
      "Lợi nhuận gộp · Tháng 10",
      "Doanh thu 86,5 triệu · Giá vốn 48,2 triệu",
      undefined,
      undefined,
      "38300000",
      "completed",
    ),
  ],
  "audit/events": [
    item(
      "AUD-0102",
      "Nguyễn Minh đã ghi sổ GR-0025",
      "POST inventory receipt · 10:21",
      undefined,
      undefined,
      undefined,
      "completed",
    ),
    item(
      "AUD-0101",
      "Trần Lan hoàn thành WO-0018",
      "96 đạt · 4 hỏng",
      undefined,
      undefined,
      undefined,
      "completed",
    ),
  ],
  jobs: [
    item(
      "JOB-IMP-019",
      "Nhập danh mục nguyên liệu",
      "145/145 dòng · Hoàn thành",
      "145",
      "dòng",
      undefined,
      "completed",
    ),
    item("JOB-RPT-020", "Xuất báo cáo tồn kho", "Đang xử lý 62%", "62", "%", undefined, "pending"),
  ],
  imports: [
    item(
      "IMP-0019",
      "materials-2026-11.xlsx",
      "145 thành công · 0 lỗi",
      "145",
      "dòng",
      undefined,
      "completed",
    ),
  ],
};

export const posProducts = catalogProducts.map((record, index) => ({
  id: record.id,
  code: record.code,
  name: record.name,
  price: ["18000", "30000", "35000"][index],
  stock: record.quantity ?? "0",
  unit: record.unit ?? "chiếc",
}));
