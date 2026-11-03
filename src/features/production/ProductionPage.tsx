import { useGetProductionRecordsQuery } from "./api";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
import { useNavigate } from "react-router-dom";
export default function ProductionPage() {
  const navigate = useNavigate();
  const query = useGetProductionRecordsQuery({ resource: "production/batches" });
  return (
    <ResourceWorkspace
      resource="production/batches"
      title="Lệnh sản xuất"
      description="Phát hành công việc, theo dõi tiến độ, ghi nhận thành phẩm đạt và sản phẩm hỏng."
      actionLabel="Tạo lệnh sản xuất"
      query={query}
      onRowSelect={(row) => navigate(`/production/${row.id}`)}
    />
  );
}
