import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useAddProductVariantMutation,
  useGetInventoryItemsQuery,
  useUpdateProductVariantMutation,
} from "../api";
import {
  filterLinkableInventoryItems,
  taxRateToPercentText,
  toVariantPayload,
  variantFieldSchema,
  type VariantFieldFormData,
} from "../productUtils";
import type { ProductVariant } from "../types";
import { VariantFormFields } from "./VariantFormFields";

interface VariantFormModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variant?: ProductVariant;
}

export function VariantFormModal({
  open,
  onClose,
  productId,
  productName,
  variant,
}: VariantFormModalProps) {
  const isEdit = Boolean(variant);

  const [addVariant, addState] = useAddProductVariantMutation();
  const [updateVariant, updateState] = useUpdateProductVariantMutation();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const linkableItems = filterLinkableInventoryItems(inventoryItems, variant?.inventory_item_id);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VariantFieldFormData>({
    resolver: zodResolver(variantFieldSchema),
    defaultValues: {
      inventory_item_id: variant?.inventory_item_id ?? linkableItems[0]?.id ?? "",
      sku: variant?.sku ?? "",
      barcode: variant?.barcode ?? "",
      name: variant?.name ?? "",
      sale_price: variant !== undefined ? String(variant.sale_price) : "",
      currency: variant?.currency ?? "VND",
      tax_percent: variant ? taxRateToPercentText(variant.tax_rate) : "0",
    },
  });

  const watchedValues = useWatch({ control });

  const activeMutationState = isEdit ? updateState : addState;
  const problem = activeMutationState.error ? toProblemDetail(activeMutationState.error) : undefined;

  const onSubmit = async (data: VariantFieldFormData) => {
    const payload = toVariantPayload(data);
    try {
      if (isEdit && variant) {
        await updateVariant({
          productId,
          variantId: variant.id,
          body: {
            ...payload,
            version: variant.version,
          },
        }).unwrap();
      } else {
        await addVariant({
          productId,
          body: payload,
        }).unwrap();
      }
      onClose();
    } catch {
      // Problem banner displays API error
    }
  };

  return (
    <Modal
      open={open}
      size="lg"
      title={isEdit ? `Sửa biến thể (${variant?.sku})` : `Thêm biến thể — ${productName}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        <VariantFormFields
          register={register}
          fieldName={(field) => field}
          errors={errors}
          linkableItems={linkableItems}
          showRelinkHint={isEdit}
          previewValues={{
            sale_price: watchedValues.sale_price,
            currency: watchedValues.currency,
            tax_percent: watchedValues.tax_percent,
          }}
        />

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={activeMutationState.isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={activeMutationState.isLoading || linkableItems.length === 0}
          >
            {activeMutationState.isLoading
              ? "Đang lưu…"
              : isEdit
                ? "Cập nhật biến thể"
                : "Thêm biến thể"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
