import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";
import {
  useCreateProductMutation,
  useGetInventoryItemsQuery,
  useUpdateProductMutation,
} from "../api";
import {
  filterLinkableInventoryItems,
  toVariantPayload,
  variantFieldSchema,
} from "../productUtils";
import type { Product } from "../types";
import { VariantFormFields } from "./VariantFormFields";

const createProductSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã sản phẩm là bắt buộc")
    .max(50, "Mã tối đa 50 ký tự")
    .regex(/^[A-Za-z0-9_.-]+$/, "Mã chỉ chứa chữ, số, dấu gạch nối, gạch dưới hoặc chấm"),
  name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc").max(255, "Tên tối đa 255 ký tự"),
  variants: z.array(variantFieldSchema).min(1, "Cần ít nhất 1 biến thể bán hàng"),
});

const editProductSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã sản phẩm là bắt buộc")
    .max(50, "Mã tối đa 50 ký tự")
    .regex(/^[A-Za-z0-9_.-]+$/, "Mã chỉ chứa chữ, số, dấu gạch nối, gạch dưới hoặc chấm"),
  name: z.string().trim().min(1, "Tên sản phẩm là bắt buộc").max(255, "Tên tối đa 255 ký tự"),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;
type EditProductFormData = z.infer<typeof editProductSchema>;

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
}

export function ProductFormModal({ open, onClose, product }: ProductFormModalProps) {
  const isEdit = Boolean(product);
  return isEdit && product ? (
    <EditProductFormModal open={open} onClose={onClose} product={product} />
  ) : (
    <CreateProductFormModal open={open} onClose={onClose} />
  );
}

function EditProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
}) {
  const [updateProduct, updateState] = useUpdateProductMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      code: product.code,
      name: product.name,
    },
  });

  const problem = updateState.error ? toProblemDetail(updateState.error) : undefined;

  const onSubmit = async (data: EditProductFormData) => {
    try {
      await updateProduct({
        id: product.id,
        body: {
          code: data.code.trim().toUpperCase(),
          name: data.name.trim(),
          version: product.version,
        },
      }).unwrap();
      onClose();
    } catch {
      // Problem banner displays API error
    }
  };

  return (
    <Modal open={open} title={`Sửa thông tin sản phẩm (${product.code})`} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        <Input
          label="Mã sản phẩm *"
          placeholder="VD: SP-BANH-KEM, SP-TRA-SUA..."
          maxLength={50}
          {...register("code")}
          error={errors.code?.message}
        />

        <Input
          label="Tên sản phẩm *"
          placeholder="VD: Bánh kem socola, Nước suối đóng chai..."
          maxLength={255}
          {...register("name")}
          error={errors.name?.message}
        />

        <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Để thêm mới hoặc chỉnh sửa giá bán, SKU, Barcode từng biến thể, hãy mở mục{" "}
          <strong>Quản lý biến thể</strong>.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={updateState.isLoading}>
            Hủy
          </Button>
          <Button type="submit" disabled={updateState.isLoading}>
            {updateState.isLoading ? "Đang lưu…" : "Cập nhật sản phẩm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateProductFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [createProduct, createState] = useCreateProductMutation();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const linkableItems = filterLinkableInventoryItems(inventoryItems);
  const defaultInventoryItemId = linkableItems[0]?.id ?? "";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      code: "",
      name: "",
      variants: [
        {
          inventory_item_id: defaultInventoryItemId,
          sku: "",
          barcode: "",
          name: "",
          sale_price: "",
          currency: "VND",
          tax_percent: "0",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedVariants = useWatch({ control, name: "variants" });

  const problem = createState.error ? toProblemDetail(createState.error) : undefined;

  const onSubmit = async (data: CreateProductFormData) => {
    try {
      await createProduct({
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        variants: data.variants.map(toVariantPayload),
      }).unwrap();
      onClose();
    } catch {
      // Problem banner displays API error
    }
  };

  const handleAppendVariant = () => {
    append({
      inventory_item_id: defaultInventoryItemId,
      sku: "",
      barcode: "",
      name: "",
      sale_price: "",
      currency: "VND",
      tax_percent: "0",
    });
  };

  return (
    <Modal open={open} size="xl" title="Tạo sản phẩm bán hàng mới" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {problem && (
          <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            <p className="font-semibold">{problem.title}</p>
            <p className="mt-0.5">{problem.detail}</p>
          </div>
        )}

        {/* Thông tin sản phẩm cha */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">1. Thông tin chung sản phẩm</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Mã sản phẩm *"
              placeholder="VD: SP-BMHC, SP-NUOC-01..."
              maxLength={50}
              {...register("code")}
              error={errors.code?.message}
            />

            <Input
              label="Tên sản phẩm *"
              placeholder="VD: Bánh mì hoa cúc, Nước suối Lavie..."
              maxLength={255}
              {...register("name")}
              error={errors.name?.message}
            />
          </div>
        </section>

        {/* Danh sách biến thể bán hàng */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Biến thể mở bán ban đầu ({fields.length})
              </h3>
              <p className="text-xs text-slate-500">
                Mỗi sản phẩm cần ít nhất 1 biến thể gắn với mặt hàng Thành phẩm hoặc Hàng thương mại đang hoạt động.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAppendVariant}>
              <Plus className="h-4 w-4" />
              Thêm biến thể
            </Button>
          </div>

          {errors.variants?.root?.message && (
            <p className="text-xs text-rose-600">{errors.variants.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => {
              const variantErrors = errors.variants?.[index];
              const preview = watchedVariants?.[index];
              return (
                <div
                  key={field.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                      Biến thể #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    )}
                  </div>

                  <VariantFormFields
                    register={register}
                    fieldName={(name) => `variants.${index}.${name}`}
                    errors={variantErrors}
                    linkableItems={linkableItems}
                    previewValues={{
                      sale_price: preview?.sale_price,
                      currency: preview?.currency,
                      tax_percent: preview?.tax_percent,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={createState.isLoading}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={createState.isLoading || linkableItems.length === 0}
          >
            {createState.isLoading ? "Đang tạo…" : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
