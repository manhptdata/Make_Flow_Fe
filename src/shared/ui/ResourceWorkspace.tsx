import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { Drawer } from "@/shared/ui/Drawer";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";
import { createIdempotencyKey } from "@/shared/lib/http";
import { useCreateResourceMutation } from "@/shared/api/resourceApi";
import type { ListItem, ListResponse } from "@/shared/types/api";

interface QueryState {
  data?: ListResponse<ListItem>;
  isLoading: boolean;
  isFetching: boolean;
  error?: unknown;
  refetch: () => unknown;
}

export interface ResourceWorkspaceProps {
  resource: string;
  title: string;
  description: string;
  query: QueryState;
  actionLabel?: string;
  form?: React.ReactNode;
  readOnly?: boolean;
  onRowSelect?: (row: ListItem) => void;
}

export function ResourceWorkspace({
  resource,
  title,
  description,
  query,
  actionLabel = "Tạo mới",
  form,
  readOnly = false,
  onRowSelect,
}: ResourceWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ListItem>();
  const rows = useMemo(
    () =>
      (query.data?.data ?? []).filter((row) =>
        `${row.code} ${row.name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [query.data, search],
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">MakeFlow workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
        {!readOnly && (
          <Button
            onClick={() => {
              setSelected(undefined);
              setDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </header>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên…"
            />
          </label>
          <span className="text-xs font-medium text-slate-500">
            {query.isFetching ? "Đang đồng bộ…" : `${rows.length} bản ghi`}
          </span>
        </div>
        {query.isLoading ? (
          <div className="p-5">
            <LoadingState />
          </div>
        ) : query.error ? (
          <div className="p-5">
            <ErrorState problem={toProblemDetail(query.error)} onRetry={() => query.refetch()} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={`Chưa có ${title.toLowerCase()}`}
              action={readOnly ? undefined : <Button onClick={() => setDrawerOpen(true)}>Tạo bản ghi</Button>}
            />
          </div>
        ) : (
          <DataTable
            rows={rows}
            onSelect={(row) => {
              if (onRowSelect) onRowSelect(row);
              else {
                setSelected(row);
                setDrawerOpen(true);
              }
            }}
          />
        )}
      </div>
      <Drawer
        open={drawerOpen}
        title={selected ? `Chi tiết ${selected.code}` : actionLabel}
        onClose={() => setDrawerOpen(false)}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-sky-50 p-4">
              <p className="text-xs font-semibold text-sky-700">{selected.code}</p>
              <p className="mt-1 text-lg font-bold">{selected.name}</p>
              <p className="mt-1 text-sm text-slate-500">{selected.description}</p>
            </div>
            {selected.status === "posted" || selected.status === "completed" ? (
              <p className="text-sm text-slate-500">
                Bản ghi đã ghi sổ sẽ chỉ được điều chỉnh bằng chứng từ bù trừ, không sửa trực tiếp.
              </p>
            ) : (
              <p className="text-sm text-slate-500">Bản nháp có thể tiếp tục hoàn thiện trước khi ghi sổ.</p>
            )}
            <Button variant="secondary" className="w-full" onClick={() => setDrawerOpen(false)}>
              Đóng
            </Button>
          </div>
        ) : (
          (form ?? <DefaultCreateForm resource={resource} onDone={() => setDrawerOpen(false)} />)
        )}
      </Drawer>
    </section>
  );
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Tên cần ít nhất 2 ký tự").max(120),
  description: z.string().trim().max(500).optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function DefaultCreateForm({ resource, onDone }: { resource: string; onDone: () => void }) {
  const [createResource, state] = useCreateResourceMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });
  const submit = handleSubmit(async (values) => {
    await createResource({ resource, body: values, idempotencyKey: createIdempotencyKey() }).unwrap();
    onDone();
  });
  const problem = state.error ? toProblemDetail(state.error) : undefined;
  return (
    <form className="space-y-4" onSubmit={submit}>
      {problem && <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{problem.detail}</div>}
      <label className="block text-sm font-medium">
        Tên
        <input className="field mt-1.5" {...register("name")} placeholder="Nhập tên bản ghi" />
        {errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name.message}</span>}
      </label>
      <label className="block text-sm font-medium">
        Ghi chú
        <textarea
          className="field mt-1.5 min-h-24 resize-y"
          {...register("description")}
          placeholder="Thông tin bổ sung"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Hủy
        </Button>
        <Button type="submit" disabled={state.isLoading}>
          {state.isLoading ? "Đang lưu…" : "Lưu bản nháp"}
        </Button>
      </div>
    </form>
  );
}
