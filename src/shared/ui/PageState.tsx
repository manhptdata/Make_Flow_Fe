import { AlertTriangle, Inbox, LoaderCircle, ShieldX } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { ProblemDetail } from "@/shared/types/api";

export function LoadingState() {
  return (
    <div className="card flex min-h-52 items-center justify-center text-slate-500">
      <LoaderCircle className="mr-2 animate-spin" /> Đang tải dữ liệu…
    </div>
  );
}

export function EmptyState({
  title = "Chưa có dữ liệu",
  action,
}: {
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-center">
      <Inbox className="h-10 w-10 text-sky-500" />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">Hãy tạo bản ghi đầu tiên hoặc thay đổi bộ lọc.</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ problem, onRetry }: { problem: ProblemDetail; onRetry?: () => void }) {
  const forbidden = problem.status === 403;
  const Icon = forbidden ? ShieldX : AlertTriangle;
  return (
    <div className="card flex min-h-52 flex-col items-center justify-center gap-3 border-rose-100 p-8 text-center">
      <Icon className="h-10 w-10 text-rose-500" />
      <div>
        <h3 className="font-semibold">{problem.title}</h3>
        <p className="mt-1 max-w-xl text-sm text-slate-500">{problem.detail}</p>
        {problem.correlation_id && (
          <p className="mt-2 text-xs text-slate-400">Mã đối soát: {problem.correlation_id}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}
