import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input, Select } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useCreateInventoryItemMutation,
  useGetUnitsQuery,
  useUpdateInventoryItemMutation,
} from "../api";
import type { InventoryItem, ItemType } from "../types";

const itemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã mặt hàng là bắt buộc")
    .max(50, "Mã tối đa 50 ký tự")
    .regex(/^[A-Za-z0-9_.-]+$/, "Mã chỉ chứa chữ, số, dấu gạch nối, gạch dưới hoặc chấm"),
  name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự").max(255, "Tên tối đa 255 ký tự"),
  itemType: z.enum(["material", "packaging", "finished_good", "resale_good"]),
  baseUnitId: z.string().uuid("Vui lòng chọn đơn vị gốc hợp lệ"),
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  item?: InventoryItem;
}

export function ItemFormModal({ open, onClose, item }: ItemFormModalProps) {
  const isEdit = Boolean(item);

  const [createItem, createState] = useCreateInventoryItemMutation();
  const [updateItem, updateState] = useUpdateInventoryItemMutation();
  const { data: units = [] } = useGetUnitsQuery();

  // FR-020: Không hiển thị inactive unit cho record mới
  const selectableUnits = units.filter(
    (u) => u.status === "active" || (isEdit && u.id === item?.base_unit_id),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      code: item?.code ?? "",
      name: item?.name ?? "",
      itemType: item?.item_type ?? "material",
      baseUnitId: item?.base_unit_id ?? selectableUnits[0]?.id ?? "",
    },
  });

  const activeMutationState = isEdit ? updateState : createState;
  const problem = activeMutationState.error ? toProblemDetail(activeMutationState.error) : undefined;

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEdit && item) {
        await updateItem({
          id: item.id,
          body: {
            name: data.name,
            item_type: data.itemType as ItemType,
            base_unit_id: data.baseUnitId,
            version: item.version,
          },
        }).unwrap();
      } else {
        await createItem({
          code: data.code.toUpperCase(),
          name: data.name,
          item_type: data.itemType as ItemType,
          base_unit_id: data.baseUnitId,
        }).unwrap();
      }
      onClose();
    } catch {
      // problem state handles error display
    }
  };

  return (
    <Modal open={open} title={isEdit ? `Sửa mặt hàng (${item?.code})` : "Thêm mặt hàng kho mới"} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        <Input
          label="Mã mặt hàng (SKU)"
          placeholder="VD: NL-BOT-13, BB-HOP-20, SP-BANHMI..."
          disabled={isEdit}
          {...register("code")}
          error={errors.code?.message}
        />

        <Input
          label="Tên mặt hàng"
          placeholder="VD: Bột mì số 13 Meizan, Hộp bánh kem 20cm..."
          {...register("name")}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Phân loại mặt hàng" {...register("itemType")}>
            <option value="material">Nguyên liệu (material)</option>
            <option value="packaging">Bao bì / Vật tư đóng gói (packaging)</option>
            <option value="finished_good">Thành phẩm sản xuất (finished_good)</option>
            <option value="resale_good">Hàng thương mại (resale_good)</option>
          </Select>

          <Select
            label="Đơn vị gốc trong kho (Base Unit)"
            {...register("baseUnitId")}
          >
            {selectableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol}) — {u.dimension}
              </option>
            ))}
          </Select>
        </div>

        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          💡 Đơn vị gốc là thước đo lưu trữ tồn kho chính xác nhất của mặt hàng này (VD: kg, quả, lít, cái). Sau khi lưu, bạn có thể thiết lập thêm các quy cách bao gói riêng (như Bao 25kg, Khay 30 quả...).
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={activeMutationState.isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={activeMutationState.isLoading}>
            {activeMutationState.isLoading ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo mặt hàng"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
