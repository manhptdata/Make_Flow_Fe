import { useMemo, useState } from "react";
import { ArrowLeft, Banknote, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCheckoutMutation, useGetPosProductsQuery, type PosProduct } from "./api";
import { Button } from "@/shared/ui/Button";
import { decimal, formatMoney, formatQuantity } from "@/shared/lib/decimal";
import { createIdempotencyKey } from "@/shared/lib/http";
import { ErrorState, LoadingState } from "@/shared/ui/PageState";
import { toProblemDetail } from "@/shared/lib/errors";

interface CartLine {
  product: PosProduct;
  quantity: string;
}

export default function PosPage() {
  const products = useGetPosProductsQuery();
  const [checkout, checkoutState] = useCheckoutMutation();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState<string>();
  const filtered = (products.data?.data ?? []).filter((p) =>
    `${p.code} ${p.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  const total = useMemo(
    () => cart.reduce((sum, line) => sum.plus(decimal(line.product.price).times(line.quantity)), decimal(0)),
    [cart],
  );
  const add = (product: PosProduct) =>
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) =>
            line.product.id === product.id
              ? { ...line, quantity: decimal(line.quantity).plus(1).toString() }
              : line,
          )
        : [...current, { product, quantity: "1" }];
    });
  const change = (id: string, delta: number) =>
    setCart((current) =>
      current.map((line) =>
        line.product.id === id ? { ...line, quantity: DecimalMaxOne(line.quantity, delta) } : line,
      ),
    );
  const submit = async () => {
    const result = await checkout({
      lines: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
      payment_method: "cash",
      received_amount: total.toString(),
      idempotency_key: createIdempotencyKey(),
    }).unwrap();
    setReceipt(result.order_code);
    setCart([]);
  };
  if (products.isLoading) return <LoadingState />;
  if (products.error)
    return <ErrorState problem={toProblemDetail(products.error)} onRetry={() => products.refetch()} />;
  return (
    <main className="min-h-screen bg-sky-50">
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sky-100 bg-white px-4 shadow-sm">
        <Link
          to="/dashboard"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Trở về"
        >
          <ArrowLeft />
        </Link>
        <div>
          <p className="font-bold text-sky-700">MakeFlow POS</p>
          <p className="text-xs text-slate-500">Cửa hàng trung tâm · Ca sáng</p>
        </div>
        <div className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Đang trực tuyến
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_390px]">
        <section className="p-4 sm:p-6">
          <label className="relative block max-w-lg">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              className="field pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên hoặc quét mã sản phẩm…"
              autoFocus
            />
          </label>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <button
                key={product.id}
                onClick={() => add(product)}
                className="card overflow-hidden text-left transition hover:-translate-y-0.5 hover:border-sky-300"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-sky-50 to-amber-50">
                  <span className="text-4xl">{product.name.includes("Bánh") ? "🥐" : "📦"}</span>
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold">{product.name}</p>
                  <p className="mt-2 font-bold text-sky-700">{formatMoney(product.price)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Còn {formatQuantity(product.stock)} {product.unit}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
        <aside className="flex flex-col border-l border-sky-100 bg-white lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]">
          <div className="flex items-center gap-2 border-b p-4">
            <ShoppingCart className="text-sky-600" />
            <h1 className="font-bold">Đơn hiện tại</h1>
            <span className="ml-auto rounded-full bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
              {cart.length} món
            </span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                <ShoppingCart className="h-12 w-12" />
                <p className="mt-3 text-sm">Chọn sản phẩm để bắt đầu đơn hàng</p>
              </div>
            ) : (
              cart.map((line) => (
                <div key={line.product.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{line.product.name}</p>
                      <p className="text-xs text-slate-500">{formatMoney(line.product.price)}</p>
                    </div>
                    <button
                      onClick={() =>
                        setCart((items) => items.filter((item) => item.product.id !== line.product.id))
                      }
                      className="text-slate-400 hover:text-rose-600"
                      aria-label="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border">
                      <button className="p-1.5" onClick={() => change(line.product.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                      <button className="p-1.5" onClick={() => change(line.product.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-bold">
                      {formatMoney(decimal(line.product.price).times(line.quantity))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Tổng thanh toán</span>
              <span className="text-2xl font-extrabold text-sky-700">{formatMoney(total)}</span>
            </div>
            {checkoutState.error && (
              <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">
                {toProblemDetail(checkoutState.error).detail}
              </p>
            )}
            {receipt && (
              <p className="mt-2 rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">
                Đã tạo hóa đơn {receipt}
              </p>
            )}
            <Button
              className="mt-4 w-full py-3"
              disabled={!cart.length || checkoutState.isLoading}
              onClick={submit}
            >
              <Banknote className="h-5 w-5" />
              {checkoutState.isLoading ? "Đang thanh toán…" : "Thanh toán tiền mặt"}
            </Button>
          </div>
        </aside>
      </div>
    </main>
  );
}
function DecimalMaxOne(value: string, delta: number) {
  return Decimal.max(1, decimal(value).plus(delta)).toString();
}
import Decimal from "decimal.js";
