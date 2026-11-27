import { useMemo, useState } from "react";
import { ArrowRightLeft, Edit, Plus, Power, PowerOff, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useActivateUnitMutation,
  useDeactivateUnitMutation,
  useGetUnitsQuery,
} from "./api";
import { UnitFormModal } from "./components/UnitFormModal";
import { ConversionPreviewModal } from "./components/ConversionPreviewModal";
import type { Dimension, Unit, UnitStatus } from "./types";

const dimensionLabels: Record<Dimension, { label: string; className: string }> = {
  mass: { label: "Khối lượng", className: "bg-teal-50 text-teal-700 border-teal-200" },
  volume: { label: "Thể tích", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  count: { label: "Số lượng đếm", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const isUnitBase = (u: Unit) => Boolean(u.is_base ?? u.base ?? u.isBase);

export default function UnitsPage() {
  const [search, setSearch] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<Dimension | "">("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "">("");

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Queries & Mutations
  const {
    data: units = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUnitsQuery({
    ...(dimensionFilter ? { dimension: dimensionFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  });

  const [activateUnit, { isLoading: isActivating }] = useActivateUnitMutation();
  const [deactivateUnit, { isLoading: isDeactivating }] = useDeactivateUnitMutation();

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        u.code.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.symbol.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [units, search]);

  const handleCreate = () => {
    setEditingUnit(undefined);
    setFormModalOpen(true);
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormModalOpen(true);
  };

  const handleToggleStatus = async (unit: Unit) => {
    try {
      if (unit.status === "active") {
        await deactivateUnit(unit.id).unwrap();
      } else {
        await activateUnit(unit.id).unwrap();
      }
    } catch {
      // Error handled by RTK Query / notification
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
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Đơn vị tính & Quy đổi</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Quản lý các đơn vị đo lường vật lý (khối lượng, thể tích, số đếm) và quy tắc chuyển đổi tỷ lệ cơ sở.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setPreviewModalOpen(true)}
            disabled={units.length === 0}
          >
            <ArrowRightLeft className="h-4 w-4" />
            Xem trước quy đổi
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Thêm đơn vị
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
                placeholder="Tìm mã, tên hoặc ký hiệu…"
              />
            </label>

            <div className="flex items-center gap-2">
              <select
                className="field text-sm"
                value={dimensionFilter}
                onChange={(e) => setDimensionFilter(e.target.value as Dimension | "")}
              >
                <option value="">Tất cả đại lượng</option>
                <option value="mass">Khối lượng (mass)</option>
                <option value="volume">Thể tích (volume)</option>
                <option value="count">Số đếm (count)</option>
              </select>

              <select
                className="field text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UnitStatus | "")}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang dùng (active)</option>
                <option value="inactive">Ngừng dùng (inactive)</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500">
            {isFetching ? "Đang đồng bộ…" : `${filteredUnits.length} đơn vị`}
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
        ) : filteredUnits.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Chưa có đơn vị tính nào phù hợp"
              action={<Button onClick={handleCreate}>Thêm đơn vị tính mới</Button>}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Mã đơn vị</th>
                  <th className="px-5 py-3">Ký hiệu & Tên</th>
                  <th className="px-5 py-3">Đại lượng</th>
                  <th className="px-5 py-3">Hệ số cơ sở (Ratio)</th>
                  <th className="px-5 py-3">Số thập phân</th>
                  <th className="px-5 py-3">Đơn vị gốc</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnits.map((u) => {
                  const dimMeta = dimensionLabels[u.dimension] ?? {
                    label: u.dimension,
                    className: "bg-slate-100 text-slate-700",
                  };
                  return (
                    <tr key={u.id} className="bg-white hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-sky-700">{u.code}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{u.name}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                            {u.symbol}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${dimMeta.className}`}
                        >
                          {dimMeta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700">
                        {u.ratio_to_base ?? u.ratioToBase}
                        {isUnitBase(u) ? (
                          <span className="ml-1 text-xs text-slate-400">(gốc = 1)</span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{u.scale} chữ số</td>
                      <td className="px-5 py-4">
                        {isUnitBase(u) ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Đơn vị chuẩn
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={u.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Sửa thông tin"
                            onClick={() => handleEdit(u)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={u.status === "active" ? "Ngừng kích hoạt" : "Kích hoạt"}
                            disabled={isActivating || isDeactivating}
                            onClick={() => handleToggleStatus(u)}
                            className={u.status === "active" ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700"}
                          >
                            {u.status === "active" ? (
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

      {/* Modals */}
      {formModalOpen && (
        <UnitFormModal
          open={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          unit={editingUnit}
        />
      )}

      {previewModalOpen && (
        <ConversionPreviewModal
          open={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          units={units}
        />
      )}
    </section>
  );
}
