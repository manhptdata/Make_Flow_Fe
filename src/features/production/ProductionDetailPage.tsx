import { CheckCircle2, Clock3, Factory, Flame, PackageCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { useCompleteProductionMutation } from "./api";
import { Button } from "@/shared/ui/Button";
import { formatMoney, formatQuantity } from "@/shared/lib/decimal";
import { createIdempotencyKey } from "@/shared/lib/http";
import { toProblemDetail } from "@/shared/lib/errors";

export default function ProductionDetailPage() {
  const { id = "WO-0018" } = useParams();
  const [completeProduction, completion] = useCompleteProductionMutation();
  const completed = completion.isSuccess;
  const finish = () => completeProduction({ id, idempotencyKey: createIdempotencyKey() });
  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600">WO-2026-0018</p>
          <h1 className="mt-1 text-3xl font-bold">Sản xuất Bánh mì bơ</h1>
          <p className="mt-1 text-sm text-slate-500">Mẻ 100 chiếc · Kho trung tâm · Công thức v3</p>
        </div>
        <Button disabled={completed || completion.isLoading} onClick={finish}>
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Đã hoàn thành" : completion.isLoading ? "Đang ghi sổ…" : "Hoàn thành sản xuất"}
        </Button>
      </header>
      {completion.error && (
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
          {toProblemDetail(completion.error).detail}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={Factory} label="Kế hoạch" value="100 chiếc" tone="sky" />
        <Metric icon={PackageCheck} label="Thành phẩm đạt" value="96 chiếc" tone="emerald" />
        <Metric icon={Flame} label="Hỏng / cháy" value="4 chiếc" tone="rose" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <h2 className="font-bold">Nguyên liệu đã tiêu hao</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Bột mì số 13", "5.000", "kg", "125000"],
              ["Bơ lạt", "1.200", "kg", "216000"],
              ["Đường", "0.800", "kg", "24000"],
            ].map(([name, quantity, unit, amount]) => (
              <div key={name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-slate-500">
                    {formatQuantity(quantity)} {unit}
                  </p>
                </div>
                <span className="font-semibold">{formatMoney(amount)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold">Phân tích chất lượng</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tỷ lệ đạt" value="96%" />
            <Row label="Chi phí thực tế" value={formatMoney("365000")} />
            <Row label="Chi phí hỏng ước tính" value={formatMoney("14600")} />
            <Row label="Giá thành/chiếc đạt" value={formatMoney("3802.0833")} />
          </dl>
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Clock3 className="mr-2 inline h-4 w-4" />
            Thành phẩm đạt mới vào kho sau khi hoàn thành mẻ.
          </div>
        </div>
      </div>
    </section>
  );
}
const metricTones = {
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
} as const;
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Factory;
  label: string;
  value: string;
  tone: keyof typeof metricTones;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${metricTones[tone]}`}>
        <Icon />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
