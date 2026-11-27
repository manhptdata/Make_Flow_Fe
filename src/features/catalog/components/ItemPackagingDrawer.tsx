import { useMemo, useState } from "react";
import { ArrowRight, PackagePlus, Sparkles, Trash2 } from "lucide-react";
import { Drawer } from "@/shared/ui/Drawer";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useAddPackagingUnitMutation,
  useGetInventoryItemByIdQuery,
  useGetUnitsQuery,
  usePreviewItemConversionMutation,
  useRemovePackagingUnitMutation,
} from "../api";
import type { InventoryItem, PreviewItemConversionResponse } from "../types";

interface ItemPackagingDrawerProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryItem;
}

export function ItemPackagingDrawer({ open, onClose, item }: ItemPackagingDrawerProps) {
  // Lấy dữ liệu mặt hàng mới nhất từ server theo ID (để đồng bộ itemUnits mới nhất)
  const { data: latestItem = item } = useGetInventoryItemByIdQuery(item?.id ?? "", {
    skip: !item?.id,
  });

  const { data: units = [] } = useGetUnitsQuery();

  const [addPackagingUnit, addState] = useAddPackagingUnitMutation();
  const [removePackagingUnit, removeState] = useRemovePackagingUnitMutation();
  const [previewConversion, previewState] = usePreviewItemConversionMutation();

  // State form thêm quy cách
  const [newUnitId, setNewUnitId] = useState("");
  const [factorToItemBase, setFactorToItemBase] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // State xem trước quy đổi
  const [previewUnitId, setPreviewUnitId] = useState("");
  const [previewQty, setPreviewQty] = useState("1");
  const [previewResult, setPreviewResult] = useState<PreviewItemConversionResponse | null>(null);

  const baseUnit = useMemo(() => {
    return units.find((u) => u.id === latestItem?.base_unit_id);
  }, [units, latestItem?.base_unit_id]);

  // Các đơn vị khả dụng để thêm làm quy cách đóng gói:
  // 1. Phải đang Active
  // 2. Không trùng với chính Base Unit của món
  // 3. Không trùng với các quy cách đã được thêm vào món này
  const availableUnitsForPackaging = useMemo(() => {
    if (!latestItem) return [];
    const existingUnitIds = new Set(latestItem.item_units?.map((u) => u.unit_id) ?? []);
    return units.filter(
      (u) => u.status === "active" && u.id !== latestItem.base_unit_id && !existingUnitIds.has(u.id),
    );
  }, [units, latestItem]);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestItem) return;

    const unitId = newUnitId || availableUnitsForPackaging[0]?.id;
    if (!unitId) {
      setAddError("Vui lòng chọn đơn vị đóng gói");
      return;
    }

    const factorNum = Number(factorToItemBase);
    if (!factorToItemBase.trim() || Number.isNaN(factorNum) || factorNum <= 0) {
      setAddError("Hệ số quy đổi phải là số lớn hơn 0");
      return;
    }

    try {
      setAddError(null);
      await addPackagingUnit({
        itemId: latestItem.id,
        body: {
          unit_id: unitId,
          factor_to_item_base: factorToItemBase.trim(),
        },
      }).unwrap();

      setNewUnitId("");
      setFactorToItemBase("");
    } catch {
      // problem handled by addState
    }
  };

  const handleRemoveUnit = async (unitId: string) => {
    if (!latestItem) return;
    try {
      await removePackagingUnit({
        itemId: latestItem.id,
        unitId,
      }).unwrap();
      if (previewUnitId === unitId) {
        setPreviewResult(null);
      }
    } catch {
      // ignore
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveUnitId = previewUnitId || currentPackagingUnits[0]?.unit_id;
    if (!latestItem || !effectiveUnitId || !previewQty.trim()) return;

    try {
      const res = await previewConversion({
        itemId: latestItem.id,
        body: {
          package_unit_id: effectiveUnitId,
          entered_quantity: previewQty.trim(),
        },
      }).unwrap();
      setPreviewResult(res);
    } catch {
      setPreviewResult(null);
    }
  };

  const currentPackagingUnits = latestItem?.item_units ?? [];

  const addProblem = addState.error ? toProblemDetail(addState.error) : undefined;
  const previewProblem = previewState.error ? toProblemDetail(previewState.error) : undefined;

  return (
    <Drawer
      open={open}
      title={latestItem ? `Quy cách đóng gói: ${latestItem.code}` : "Quy cách đóng gói"}
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Info card */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Mặt hàng</p>
          <p className="mt-1 text-base font-bold text-slate-900">{latestItem?.name}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span>Đơn vị gốc lưu kho:</span>
            <span className="font-mono font-bold text-emerald-700">
              {baseUnit ? `${baseUnit.name} (${baseUnit.symbol})` : "—"}
            </span>
          </div>
        </div>

        {/* Section 1: Existing Packaging Units */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách quy cách ({currentPackagingUnits.length})
            </h3>
          </div>

          {currentPackagingUnits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
              Mặt hàng này chưa khai báo quy cách đóng gói riêng (như Thùng, Khay, Bao...). Mặc định chỉ sử dụng đơn vị gốc.
            </div>
          ) : (
            <div className="space-y-2">
              {currentPackagingUnits.map((u) => {
                const pkgUnit = units.find((x) => x.id === u.unit_id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {pkgUnit ? pkgUnit.name : "Đơn vị"}
                        </span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
                          {pkgUnit?.symbol ?? ""}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        1 {pkgUnit?.symbol ?? "đơn vị"} ={" "}
                        <strong className="text-sky-700">{String(u.factor_to_item_base)}</strong>{" "}
                        {baseUnit?.symbol ?? "đơn vị gốc"}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      title="Xóa quy cách"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={removeState.isLoading}
                      onClick={() => handleRemoveUnit(u.unit_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Add new Packaging Unit Form */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">Thêm quy cách đóng gói mới</h4>
          </div>

          {addProblem && (
            <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700" role="alert">
              {addProblem.detail}
            </div>
          )}

          {addError && (
            <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700">
              {addError}
            </div>
          )}

          {availableUnitsForPackaging.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              Đã gán hết tất cả các đơn vị khả dụng hoặc chưa có đơn vị phụ trợ phù hợp trong danh mục.
            </p>
          ) : (
            <form onSubmit={handleAddUnit} className="space-y-3">
              <Select
                label="Đơn vị đóng gói"
                value={newUnitId}
                onChange={(e) => setNewUnitId(e.target.value)}
              >
                {availableUnitsForPackaging.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol}) — {u.dimension}
                  </option>
                ))}
              </Select>

              <Input
                label={`Hệ số quy đổi (1 đơn vị đóng gói = ... ${baseUnit?.symbol ?? "đơn vị gốc"})`}
                placeholder="VD: 25 (nếu 1 bao = 25 kg), 10, 30..."
                value={factorToItemBase}
                onChange={(e) => {
                  setFactorToItemBase(e.target.value);
                  setAddError(null);
                }}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={addState.isLoading || !factorToItemBase.trim()}
              >
                {addState.isLoading ? "Đang thêm…" : "Lưu quy cách mới"}
              </Button>
            </form>
          )}
        </section>

        {/* Section 3: Preview package conversion */}
        {currentPackagingUnits.length > 0 && (
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Xem trước quy đổi bao gói</h4>
            </div>

            {previewProblem && (
              <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700">
                {previewProblem.detail}
              </div>
            )}

            <form onSubmit={handlePreview} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="Quy cách đóng gói"
                  value={previewUnitId || currentPackagingUnits[0]?.unit_id}
                  onChange={(e) => {
                    setPreviewUnitId(e.target.value);
                    setPreviewResult(null);
                  }}
                >
                  {currentPackagingUnits.map((u) => {
                    const unit = units.find((x) => x.id === u.unit_id);
                    return (
                      <option key={u.id} value={u.unit_id}>
                        {unit?.name ?? u.unit_id}
                      </option>
                    );
                  })}
                </Select>

                <Input
                  label="Số lượng đóng gói"
                  type="number"
                  min="0"
                  step="any"
                  value={previewQty}
                  onChange={(e) => {
                    setPreviewQty(e.target.value);
                    setPreviewResult(null);
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={previewState.isLoading || !previewQty.trim()}
              >
                {previewState.isLoading ? "Đang tính…" : "Thử quy đổi"}
              </Button>
            </form>

            {previewResult && (
              <div className="rounded-xl border border-indigo-200 bg-white p-3.5 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                  Kết quả quy đổi chuẩn
                </p>
                <div className="mt-1 flex items-center gap-2 font-mono font-bold text-slate-800">
                  <span>
                    {String(previewResult.entered_quantity)}{" "}
                    {units.find((u) => u.id === previewResult.package_unit_id)?.symbol ?? "bao gói"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  <span className="text-emerald-700">
                    {String(previewResult.converted_base_quantity)} {baseUnit?.symbol ?? "đơn vị gốc"}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
