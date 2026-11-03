import { useGetCatalogRecordsQuery } from "@/features/catalog/api";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";

const views = {
  "/catalog/units": {
    resource: "catalog/units",
    title: "Đơn vị tính",
    description: "Định nghĩa đơn vị cơ sở và quy tắc quy đổi an toàn.",
  },
  "/catalog/items": {
    resource: "catalog/items",
    title: "Nguyên liệu và vật tư",
    description: "Quản lý nguyên liệu, bao bì và hàng hóa có theo dõi tồn kho.",
  },
  "/catalog/products": {
    resource: "catalog/products",
    title: "Sản phẩm",
    description: "Quản lý sản phẩm bán ra, biến thể, giá bán và trạng thái kinh doanh.",
  },
};

export default function CatalogPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetCatalogRecordsQuery({ resource: config.resource, scenario });
  return <ResourceWorkspace {...config} query={query} />;
}
