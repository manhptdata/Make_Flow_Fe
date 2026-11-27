import { useMemo, useState } from "react";
import { Boxes, Edit, Package, Plus, Power, PowerOff, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useActivateInventoryItemMutation,
  useDeactivateInventoryItemMutation,
  useGetInventoryItemsQuery,
  useGetUnitsQuery,
} from "./api";
import { ItemFormModal } from "./components/ItemFormModal";
import { ItemPackagingDrawer } from "./components/ItemPackagingDrawer";
import type { InventoryItem, ItemStatus, ItemType } from "./types";

const itemTypeLabels: Record<ItemType, { label: string; className: string }> = {
  material: { label: "Nguyên liệu", className: "bg-teal-50 text-teal-700 border-teal-200" },
  packaging: { label: "Bao bì", className: "bg-sky-50 text-sky-700 border-sky-200" },
  finished_good: { label: "Thành phẩm", className: "bg-amber-50 text-amber-700 border-amber-200" },
  resale_good: { label: "Hàng thương mại", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "">("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "">("");

  // Modal / Drawer state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  const [packagingDrawerOpen, setPackagingDrawerOpen] = useState(false);
  const [selectedPackagingItem, setSelectedPackagingItem] = useState<InventoryItem | undefined>(undefined);

  // Queries & Mutations
  const {
    data: items = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetInventoryItemsQuery({
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  });

  const { data: units = [] } = useGetUnitsQuery();

  const [activateItem, { isLoading: isActivating }] = useActivateInventoryItemMutation();
  const [deactivateItem, { isLoading: isDeactivating }] = useDeactivateInventoryItemMutation();

  const unitMap = useMemo(() => {
    return new Map(units.map((u) => [u.id, u]));
  }, [units]);

  const handleCreate = () => {
    setEditingItem(undefined);
    setFormModalOpen(true);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleOpenPackaging = (item: InventoryItem) => {
    setSelectedPackagingItem(item);
    setPackagingDrawerOpen(true);
  };

  const handleToggleStatus = async (item: InventoryItem) => {
    try {
      if (item.status === "active") {
        await deactivateItem(item.id).unwrap();
      } else {
        await activateItem(item.id).unwrap();
      }
    } catch {
      // Problem state handles notification
    }
  };

  return (
    <section className="space-y-5">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Quản lý Danh mục
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Mặt hàng & Quy cách kho</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Quản lý nguyên liệu, bao bì, thành phẩm sản xuất và hàng thương mại cùng đơn vị gốc và quy cách bao gói riêng theo món.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Thêm mặt hàng
          </Button>
        </div>
      </header>

      {/* Main card */}
      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="field pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã SKU hoặc tên mặt hàng…"
              />
            </label>

            <div className="flex items-center gap-2">
              <select
                className="field text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ItemType | "")}
              >
                <option value="">Tất cả phân loại</option>
                <option value="material">Nguyên liệu (material)</option>
                <option value="packaging">Bao bì (packaging)</option>
                <option value="finished_good">Thành phẩm (finished_good)</option>
                <option value="resale_good">Hàng thương mại (resale_good)</option>
              </select>

              <select
                className="field text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ItemStatus | "")}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang dùng (active)</option>
                <option value="inactive">Ngừng dùng (inactive)</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {isFetching ? "Đang đồng bộ…" : `${items.length} mặt hàng`}
          </span>
        </div>

        {/* Content Table / States */}
        {isLoading ? (
          <div className="p-8">
            <LoadingState />
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState problem={toProblemDetail(error)} onRetry={refetch} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Chưa có mặt hàng nào phù hợp"
              action={<Button onClick={handleCreate}>Thêm mặt hàng mới</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Mã SKU</th>
                  <th className="px-5 py-3">Tên mặt hàng</th>
                  <th className="px-5 py-3">Phân loại</th>
                  <th className="px-5 py-3">Đơn vị gốc</th>
                  <th className="px-5 py-3">Quy cách bao gói</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => {
                  const typeMeta = itemTypeLabels[it.item_type] ?? {
                    label: it.item_type,
                    className: "bg-slate-100 text-slate-700",
                  };
                  const baseUnit = unitMap.get(it.base_unit_id);
                  const pkgCount = it.item_units?.length ?? 0;

                  return (
                    <tr key={it.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-sky-700">{it.code}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{it.name}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeMeta.className}`}
                        >
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {baseUnit ? `${baseUnit.name} (${baseUnit.symbol})` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenPackaging(it)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition"
                        >
                          <Boxes className="h-3.5 w-3.5" />
                          {pkgCount > 0 ? `${pkgCount} quy cách` : "Thiết lập quy cách"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={it.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Quản lý quy cách đóng gói"
                            onClick={() => handleOpenPackaging(it)}
                          >
                            <Package className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Sửa mặt hàng"
                            onClick={() => handleEdit(it)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={it.status === "active" ? "Ngừng dùng" : "Kích hoạt"}
                            disabled={isActivating || isDeactivating}
                            onClick={() => handleToggleStatus(it)}
                            className={
                              it.status === "active"
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-emerald-600 hover:text-emerald-700"
                            }
                          >
                            {it.status === "active" ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tạo/sửa */}
      {formModalOpen && (
        <ItemFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          item={editingItem}
        />
      )}

      {/* Drawer quản lý quy cách */}
      {packagingDrawerOpen && selectedPackagingItem && (
        <ItemPackagingDrawer
          open={packagingDrawerOpen}
          onClose={() => setPackagingDrawerOpen(false)}
          item={selectedPackagingItem}
        />
      )}
    </section>
  );
}
