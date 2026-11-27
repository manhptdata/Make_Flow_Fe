import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";
import { useCreateUnitMutation, useUpdateUnitMutation } from "../api";
import type { Dimension, Unit } from "../types";

const unitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã đơn vị là bắt buộc")
    .max(20, "Mã tối đa 20 ký tự")
    .regex(/^[A-Za-z0-9_]+$/, "Mã chỉ chứa chữ, số và dấu gạch dưới"),
  name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự").max(100, "Tên tối đa 100 ký tự"),
  symbol: z.string().trim().min(1, "Ký hiệu là bắt buộc").max(20, "Ký hiệu tối đa 20 ký tự"),
  dimension: z.enum(["mass", "volume", "count"]),
  isBase: z.boolean(),
  ratioToBase: z
    .string()
    .trim()
    .min(1, "Hệ số quy đổi là bắt buộc")
    .refine((val) => {
      const num = Number(val);
      return !Number.isNaN(num) && num > 0;
    }, "Hệ số quy đổi phải là số lớn hơn 0"),
  scale: z
    .number()
    .int("Phải là số nguyên")
    .min(0, "Tối thiểu 0")
    .max(6, "Tối đa 6 chữ số thập phân"),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitFormModalProps {
  open: boolean;
  onClose: () => void;
  unit?: Unit;
}

export function UnitFormModal({ open, onClose, unit }: UnitFormModalProps) {
  const [createUnit, createState] = useCreateUnitMutation();
  const [updateUnit, updateState] = useUpdateUnitMutation();
  const initialIsBase = unit ? Boolean(unit.is_base ?? unit.base ?? unit.isBase) : false;
  const [isBase, setIsBase] = useState(initialIsBase);

  const isEdit = Boolean(unit);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      code: unit?.code ?? "",
      name: unit?.name ?? "",
      symbol: unit?.symbol ?? "",
      dimension: unit?.dimension ?? "mass",
      isBase: initialIsBase,
      ratioToBase: unit ? (unit.ratio_to_base ?? unit.ratioToBase ?? "") : "",
      scale: unit?.scale ?? 2,
    },
  });

  const activeMutationState = isEdit ? updateState : createState;
  const problem = activeMutationState.error ? toProblemDetail(activeMutationState.error) : undefined;

  const onSubmit = async (data: UnitFormData) => {
    try {
      if (isEdit && unit) {
        await updateUnit({
          id: unit.id,
          body: {
            name: data.name,
            symbol: data.symbol,
            ratio_to_base: isBase ? "1" : data.ratioToBase,
            scale: data.scale,
            is_base: isBase,
            base: isBase,
            version: unit.version,
          },
        }).unwrap();
      } else {
        await createUnit({
          code: data.code.toUpperCase(),
          name: data.name,
          symbol: data.symbol,
          dimension: data.dimension as Dimension,
          ratio_to_base: isBase ? "1" : data.ratioToBase,
          scale: data.scale,
          is_base: isBase,
          base: isBase,
        }).unwrap();
      }
      onClose();
    } catch {
      // Problem state handles display
    }
  };

  return (
    <Modal open={open} title={isEdit ? `Sửa đơn vị tính (${unit?.code})` : "Thêm đơn vị tính mới"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Mã đơn vị"
            placeholder="VD: KG, G, PCS"
            disabled={isEdit}
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Ký hiệu"
            placeholder="VD: kg, g, cái"
            {...register("symbol")}
            error={errors.symbol?.message}
          />
        </div>

        <Input
          label="Tên đơn vị tính"
          placeholder="VD: Kilogram, Gram, Chiếc..."
          {...register("name")}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Nhóm đại lượng" disabled={isEdit} {...register("dimension")}>
            <option value="mass">Khối lượng (mass)</option>
            <option value="volume">Thể tích (volume)</option>
            <option value="count">Số lượng đếm (count)</option>
          </Select>

          <Input
            label="Số chữ số thập phân (scale)"
            type="number"
            min={0}
            max={6}
            {...register("scale", { valueAsNumber: true })}
            error={errors.scale?.message}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={isBase}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsBase(checked);
                setValue("isBase", checked);
                if (checked) {
                  setValue("ratioToBase", "1", { shouldValidate: true });
                } else if (!isEdit) {
                  setValue("ratioToBase", "");
                }
              }}
            />
            <span className="text-sm font-semibold text-slate-800">
              Đặt làm Đơn vị cơ sở (Base Unit) của nhóm này
            </span>
          </label>
          <p className="mt-1 text-xs text-slate-500 pl-6.5">
            Mỗi nhóm đại lượng chỉ có tối đa 1 đơn vị chuẩn (ví dụ: kg cho khối lượng, l cho thể tích). Đơn vị chuẩn có hệ số quy đổi mặc định bằng 1.
          </p>
        </div>

        {!isBase && (
          <Input
            label="Hệ số quy đổi về đơn vị chuẩn (Ratio to Base)"
            placeholder="VD: 0.001 (nếu là gram so với kg), 1000..."
            {...register("ratioToBase")}
            error={errors.ratioToBase?.message}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={activeMutationState.isLoading}>
            Hủy
          </Button>
          <Button type="submit" disabled={activeMutationState.isLoading}>
            {activeMutationState.isLoading ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo đơn vị"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
