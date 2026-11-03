import { useGetInventoryRecordsQuery } from "./api";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
const views = {
  "/inventory/balances": {
    resource: "inventory/balances",
    title: "Tồn kho",
    description: "Tồn khả dụng theo kho, nguyên liệu và thành phẩm tại thời điểm hiện tại.",
    readOnly: true,
  },
  "/inventory/movements": {
    resource: "inventory/movements",
    title: "Sổ kho",
    description: "Dòng thời gian bất biến của mọi biến động nhập, xuất, sản xuất và bán hàng.",
    readOnly: true,
  },
  "/inventory/adjustments": {
    resource: "inventory/adjustments",
    title: "Điều chỉnh kho",
    description: "Lập chứng từ tăng giảm có lý do, phê duyệt và khả năng đối soát.",
    actionLabel: "Tạo điều chỉnh",
  },
};
export default function InventoryPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetInventoryRecordsQuery({ resource: config.resource, scenario });
  return <ResourceWorkspace {...config} query={query} />;
}
