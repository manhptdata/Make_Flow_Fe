import { Badge } from "@/shared/ui/Badge";
import type { ListItem } from "@/shared/types/api";
import { formatMoney, formatQuantity } from "@/shared/lib/decimal";

export function DataTable({ rows, onSelect }: { rows: ListItem[]; onSelect?: (row: ListItem) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Mã</th>
            <th className="px-5 py-3">Tên</th>
            <th className="px-5 py-3">Số lượng</th>
            <th className="px-5 py-3">Giá trị</th>
            <th className="px-5 py-3">Trạng thái</th>
            <th className="px-5 py-3">Cập nhật</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer bg-white hover:bg-sky-50/60"
              onClick={() => onSelect?.(row)}
            >
              <td className="px-5 py-4 font-mono text-xs text-sky-700">{row.code}</td>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-800">{row.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{row.description}</p>
              </td>
              <td className="px-5 py-4">
                {row.quantity ? `${formatQuantity(row.quantity)} ${row.unit ?? ""}` : "—"}
              </td>
              <td className="px-5 py-4">{row.amount ? formatMoney(row.amount) : "—"}</td>
              <td className="px-5 py-4">
                <Badge status={row.status} />
              </td>
              <td className="px-5 py-4 text-slate-500">
                {new Date(row.updated_at).toLocaleDateString("vi-VN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
