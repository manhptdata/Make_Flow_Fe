import { useGetReportRecordsQuery } from "./api";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
const views = {
  "/reports/inventory": {
    resource: "reports/inventory",
    title: "Báo cáo tồn kho",
    description: "Giá trị tồn, hàng sắp thiếu và tốc độ sử dụng theo kho.",
    readOnly: true,
  },
  "/reports/quality": {
    resource: "reports/quality",
    title: "Báo cáo chất lượng",
    description: "Sản lượng đạt, tỷ lệ hỏng, lý do và chi phí hỏng ước tính.",
    readOnly: true,
  },
  "/reports/gross-profit": {
    resource: "reports/gross-profit",
    title: "Lợi nhuận gộp",
    description: "Doanh thu, giá vốn và lợi nhuận ước tính từ dữ liệu đã ghi sổ.",
    readOnly: true,
  },
};
export default function ReportsPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetReportRecordsQuery({ resource: config.resource, scenario });
  return <ResourceWorkspace {...config} query={query} />;
}
