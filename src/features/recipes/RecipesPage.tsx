import { useGetRecipeRecordsQuery } from "./api";
import { AlertTriangle } from "lucide-react";
import { useResourceView } from "@/shared/lib/routes";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";

const views = {
  "/recipes": {
    resource: "recipes",
    title: "Công thức sản xuất",
    description: "Quản lý phiên bản công thức, định mức nguyên liệu và sản lượng chuẩn.",
    actionLabel: "Tạo công thức",
  },
  "/estimates": {
    resource: "production/estimates",
    title: "Ước tính sản xuất",
    description: "Ước tính số lượng có thể sản xuất, nguyên liệu giới hạn và giá thành tại một thời điểm.",
    actionLabel: "Tạo ước tính",
  },
};
export default function RecipesPage() {
  const { config, scenario } = useResourceView(views);
  const query = useGetRecipeRecordsQuery({ resource: config.resource, scenario });
  const isEstimate = config.resource === "production/estimates";
  return (
    <div className="space-y-4">
      {isEstimate && (
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
          <div>
            <p className="font-semibold">Ước tính phụ thuộc dữ liệu tồn và giá hiện có</p>
            <p className="mt-1 text-amber-800">
              Dữ liệu tại {new Date().toLocaleString("vi-VN")} · Nguyên liệu giới hạn: Bơ lạt. Giá trị thiếu
              không được tự động coi là 0.
            </p>
          </div>
        </div>
      )}
      <ResourceWorkspace {...config} query={query} />
    </div>
  );
}
