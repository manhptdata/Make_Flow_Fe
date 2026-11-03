import { useGetOrdersQuery } from "./api";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
export default function SalesPage() {
  const query = useGetOrdersQuery({ resource: "sales/orders" });
  return (
    <ResourceWorkspace
      resource="sales/orders"
      title="Đơn bán hàng"
      description="Tra cứu giao dịch tại quầy, thanh toán, giá vốn và biên lợi nhuận ước tính."
      actionLabel="Mở màn hình POS"
      query={query}
    />
  );
}
