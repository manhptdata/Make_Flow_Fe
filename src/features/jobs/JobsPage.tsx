import { useGetJobsQuery } from "./api";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
const views = {
  "/jobs": {
    resource: "jobs",
    title: "Công việc nền",
    description: "Theo dõi tiến độ, lỗi và số lần thử lại của tác vụ bất đồng bộ.",
  },
  "/imports": {
    resource: "imports",
    title: "Nhập dữ liệu",
    description: "Tải tệp, kiểm tra dữ liệu và theo dõi kết quả nhập theo từng dòng.",
    actionLabel: "Tải tệp lên",
  },
};
export default function JobsPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetJobsQuery({ resource: config.resource, scenario }, { pollingInterval: 15000 });
  return <ResourceWorkspace {...config} query={query} />;
}
