import { useState } from "react";
import { ArrowRight, ArrowRightLeft, Sparkles } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";
import { usePreviewConversionMutation } from "../api";
import type { ConversionPreviewResponse, Unit } from "../types";

interface ConversionPreviewModalProps {
  open: boolean;
  onClose: () => void;
  units: Unit[];
}

export function ConversionPreviewModal({ open, onClose, units }: ConversionPreviewModalProps) {
  const activeUnits = units.filter((u) => u.status === "active");

  const [sourceUnitId, setSourceUnitId] = useState<string>(activeUnits[0]?.id ?? "");
  const [targetUnitId, setTargetUnitId] = useState<string>(
    activeUnits.find((u) => u.id !== activeUnits[0]?.id && u.dimension === activeUnits[0]?.dimension)?.id ??
      activeUnits[1]?.id ??
      "",
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [result, setResult] = useState<ConversionPreviewResponse | null>(null);

  const [previewConversion, state] = usePreviewConversionMutation();

  const handleSourceChange = (id: string) => {
    setSourceUnitId(id);
    setResult(null);
    const src = activeUnits.find((u) => u.id === id);
    if (src) {
      // Gợi ý chọn target unit cùng dimension nếu có
      const sameDimTarget = activeUnits.find((u) => u.dimension === src.dimension && u.id !== id);
      if (sameDimTarget) {
        setTargetUnitId(sameDimTarget.id);
      }
    }
  };

  const handleTargetChange = (id: string) => {
    setTargetUnitId(id);
    setResult(null);
  };

  const handleSwap = () => {
    const temp = sourceUnitId;
    setSourceUnitId(targetUnitId);
    setTargetUnitId(temp);
    setResult(null);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUnitId || !targetUnitId || !quantity.trim()) return;

    try {
      const res = await previewConversion({
        source_unit_id: sourceUnitId,
        target_unit_id: targetUnitId,
        quantity: quantity.trim(),
      }).unwrap();
      setResult(res);
    } catch {
      setResult(null);
    }
  };

  const sourceUnit = activeUnits.find((u) => u.id === sourceUnitId);
  const targetUnit = activeUnits.find((u) => u.id === targetUnitId);
  const isCrossDimension = sourceUnit && targetUnit && sourceUnit.dimension !== targetUnit.dimension;
  const sourceRatio = sourceUnit ? (sourceUnit.ratio_to_base ?? sourceUnit.ratioToBase) : undefined;
  const targetRatio = targetUnit ? (targetUnit.ratio_to_base ?? targetUnit.ratioToBase) : undefined;
  const hasSameRatioWarning =
    sourceUnit &&
    targetUnit &&
    sourceUnit.id !== targetUnit.id &&
    !isCrossDimension &&
    sourceRatio !== undefined &&
    targetRatio !== undefined &&
    Number(sourceRatio) === Number(targetRatio);

  const problem = state.error ? toProblemDetail(state.error) : undefined;

  return (
    <Modal open={open} title="Thử nghiệm Quy đổi Đơn vị (Preview)" onClose={onClose}>
      <form onSubmit={handleConvert} className="space-y-4">
        <p className="text-sm text-slate-500">
          Công cụ tính toán thử nghiệm theo thuật toán chuẩn của hệ thống:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700">
            Base = Lượng × Tỷ lệ nguồn; Đích = Base ÷ Tỷ lệ đích
          </code>
          . Phép tính chỉ xem trước và không lưu vào cơ sở dữ liệu.
        </p>

        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        {isCrossDimension && !problem && (
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ Lưu ý: Đơn vị nguồn và đơn vị đích khác nhóm đại lượng ({sourceUnit?.dimension} ≠ {targetUnit?.dimension}). Máy chủ sẽ từ chối quy đổi chéo (HTTP 422).
          </div>
        )}

        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr,auto,1fr]">
          <Select
            label="Đơn vị nguồn"
            value={sourceUnitId}
            onChange={(e) => handleSourceChange(e.target.value)}
          >
            {activeUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} ({u.name} - {u.dimension})
              </option>
            ))}
          </Select>

          <div className="flex justify-center pb-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              title="Đảo chiều quy đổi"
              onClick={handleSwap}
              disabled={!sourceUnitId || !targetUnitId}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <Select
            label="Đơn vị đích"
            value={targetUnitId}
            onChange={(e) => handleTargetChange(e.target.value)}
          >
            {activeUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} ({u.name} - {u.dimension})
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Số lượng cần quy đổi"
          placeholder="VD: 2500, 1.5, 10..."
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setResult(null);
          }}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="submit"
            disabled={state.isLoading || !sourceUnitId || !targetUnitId || !quantity.trim()}
          >
            <Sparkles className="h-4 w-4" />
            {state.isLoading ? "Đang tính…" : "Thực hiện quy đổi"}
          </Button>
        </div>

        {result && (
          <div className="mt-4 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Kết quả xem trước
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900">
              <span className="font-mono text-sky-700">
                {result.entered_quantity ?? result.enteredQuantity}{" "}
                {result.source_unit_code ?? result.sourceUnitCode}
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400" />
              <span className="font-mono text-emerald-600">
                {result.converted_quantity ?? result.convertedQuantity}{" "}
                {result.target_unit_code ?? result.targetUnitCode}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tỷ lệ quy chiếu: 1 {sourceUnit?.code} = {sourceRatio ?? "?"} base · 1 {targetUnit?.code}{" "}
              = {targetRatio ?? "?"} base.
            </p>
            {hasSameRatioWarning && (
              <p className="mt-1.5 text-xs font-medium text-amber-700">
                ⚠️ Hai đơn vị đang có cùng hệ số quy đổi ({sourceRatio}). Nếu kết quả chưa đúng thực tế, hãy kiểm tra lại hệ số (Ratio) của từng đơn vị trong danh sách.
              </p>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

