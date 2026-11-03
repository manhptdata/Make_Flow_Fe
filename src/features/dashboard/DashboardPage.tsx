import { AlertTriangle, CircleDollarSign, Factory, PackageOpen, TrendingUp } from "lucide-react";
import { useGetDashboardQuery } from "./api";
import { formatMoney } from "@/shared/lib/decimal";
import { ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";

export default function DashboardPage() {
  const query = useGetDashboardQuery();
  if (query.isLoading) return <LoadingState />;
  if (query.error || !query.data)
    return <ErrorState problem={toProblemDetail(query.error)} onRetry={() => query.refetch()} />;
  const data = query.data;
  const max = Math.max(...data.sales.map((item) => item.value));
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-600">Tổng quan hôm nay</p>
        <h1 className="mt-1 text-3xl font-bold">Chào buổi sáng, Minh</h1>
        <p className="mt-1 text-sm text-slate-500">Dữ liệu đã ghi sổ của Cửa hàng trung tâm.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={CircleDollarSign}
          label="Doanh thu"
          value={formatMoney(data.revenue)}
          note="+12,4% so với hôm qua"
        />
        <Kpi
          icon={PackageOpen}
          label="Giá trị tồn"
          value={formatMoney(data.inventory_value)}
          note={`${data.low_stock} mặt hàng sắp thiếu`}
          warning={data.low_stock > 0}
        />
        <Kpi
          icon={Factory}
          label="Mẻ đang chạy"
          value={`${data.active_batches}`}
          note="2 mẻ sắp hoàn thành"
        />
        <Kpi
          icon={TrendingUp}
          label="Tỷ lệ hỏng"
          value={`${data.rejection_rate}%`}
          note="-0,8% trong 7 ngày"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Doanh thu 7 ngày</h2>
              <p className="text-xs text-slate-500">Đơn vị: triệu đồng</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Đã đối soát
            </span>
          </div>
          <div className="mt-6 flex h-56 items-end gap-3">
            {data.sales.map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400"
                  style={{ height: `${Math.max(12, (item.value / max) * 100)}%` }}
                  title={`${item.value} triệu`}
                />
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Việc cần chú ý</h2>
          <div className="mt-4 space-y-3">
            <Notice
              icon={AlertTriangle}
              title="Bột mì sắp dưới tồn tối thiểu"
              detail="Còn 12,5 kg tại Kho trung tâm"
            />
            <Notice icon={Factory} title="Mẻ WO-0018 chờ hoàn thành" detail="Đã bắt đầu 2 giờ trước" />
            <Notice
              icon={PackageOpen}
              title="Phiếu nhập GR-0026 đang nháp"
              detail="Cần ghi sổ để cập nhật tồn"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
function Kpi({
  icon: Icon,
  label,
  value,
  note,
  warning,
}: {
  icon: typeof Factory;
  label: string;
  value: string;
  note: string;
  warning?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span
          className={`rounded-xl p-2.5 ${warning ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{note}</p>
    </div>
  );
}
function Notice({ icon: Icon, title, detail }: { icon: typeof Factory; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-slate-50 p-3">
      <Icon className="mt-0.5 h-4 w-4 flex-none text-sky-600" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
