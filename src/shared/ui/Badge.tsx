import type { EntityStatus } from "@/shared/types/api";

const styles: Record<EntityStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  completed: "bg-emerald-50 text-emerald-700",
  posted: "bg-sky-50 text-sky-700",
  draft: "bg-slate-100 text-slate-600",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700",
};

const labels: Record<EntityStatus, string> = {
  active: "Đang dùng",
  completed: "Hoàn thành",
  posted: "Đã ghi sổ",
  draft: "Bản nháp",
  pending: "Đang xử lý",
  rejected: "Có hỏng",
};

export function Badge({ status }: { status: EntityStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
