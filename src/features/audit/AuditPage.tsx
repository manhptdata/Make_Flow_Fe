import { useGetAuditEventsQuery } from "./api";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
export default function AuditPage() {
  const query = useGetAuditEventsQuery({ resource: "audit/events" });
  return (
    <ResourceWorkspace
      resource="audit/events"
      title="Nhật ký hệ thống"
      description="Theo dõi ai đã thực hiện thay đổi gì, vào thời điểm nào và trên bản ghi nào."
      readOnly
      query={query}
    />
  );
}
