import { useGetReceiptRecordsQuery } from "./api";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
export default function ProcurementPage() {
  const query = useGetReceiptRecordsQuery({ resource: "inventory/receipts" });
  return (
    <ResourceWorkspace
      resource="inventory/receipts"
      title="Phiếu nhập kho"
      description="Ghi nhận nguyên liệu nhập, đơn giá, nhà cung cấp và ghi sổ tồn kho."
      actionLabel="Tạo phiếu nhập"
      query={query}
    />
  );
}
