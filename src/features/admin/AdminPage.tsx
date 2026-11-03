import { useGetAdminRecordsQuery } from "./api";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
const views = {
  "/admin/users": {
    resource: "admin/users",
    title: "Người dùng",
    description: "Phân công nhân sự vào chi nhánh và kiểm soát trạng thái truy cập.",
    actionLabel: "Mời người dùng",
  },
  "/admin/roles": {
    resource: "admin/roles",
    title: "Vai trò và quyền",
    description: "Nhóm quyền theo nhiệm vụ chủ cửa hàng, quản lý, sản xuất và thu ngân.",
  },
  "/admin/settings": {
    resource: "admin/settings",
    title: "Thiết lập hệ thống",
    description: "Tiền tệ, múi giờ, chính sách kho, đánh số chứng từ và tùy chọn vận hành.",
  },
};
export default function AdminPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetAdminRecordsQuery({ resource: config.resource, scenario });
  return <ResourceWorkspace {...config} query={query} />;
}
