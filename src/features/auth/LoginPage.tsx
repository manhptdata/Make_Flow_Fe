import { zodResolver } from "@hookform/resolvers/zod";
import { Factory, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useLoginMutation } from "./api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";

const schema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [login, state] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "owner@makeflow.local", password: "demo123" },
  });
  const submit = handleSubmit(async (values) => {
    await login(values).unwrap();
    navigate("/dashboard", { replace: true });
  });
  const problem = state.error ? toProblemDetail(state.error) : undefined;
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-sky-700 to-sky-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="rounded-xl bg-white/15 p-2">
            <Factory />
          </span>
          MakeFlow
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
            Từ nguyên liệu đến doanh thu
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-extrabold leading-tight">
            Sản xuất đúng, bán hàng nhanh, nhìn thấy toàn bộ chi phí.
          </h1>
          <p className="mt-5 max-w-lg text-sky-100">
            Một luồng thống nhất cho công thức, tồn kho, chất lượng, POS và báo cáo vận hành.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-sky-100">
          <ShieldCheck />
          Phiên đăng nhập an toàn bằng HttpOnly cookie và CSRF.
        </div>
      </section>
      <section className="flex items-center justify-center bg-sky-50/60 p-6">
        <div className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-7 shadow-soft sm:p-10">
          <div className="mb-7 lg:hidden">
            <div className="flex items-center gap-2 text-xl font-bold text-sky-700">
              <Factory />
              MakeFlow
            </div>
          </div>
          <h2 className="text-2xl font-bold">Chào mừng trở lại</h2>
          <p className="mt-2 text-sm text-slate-500">Đăng nhập vào không gian làm việc của bạn.</p>
          {problem && (
            <div className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{problem.detail}</div>
          )}
          <form className="mt-7 space-y-5" onSubmit={submit}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Mật khẩu"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button className="w-full" disabled={state.isLoading}>
              {state.isLoading ? "Đang đăng nhập…" : "Đăng nhập"}
            </Button>
          </form>
          <p className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            Tài khoản demo đã được điền sẵn. Mock không lưu token vào localStorage.
          </p>
        </div>
      </section>
    </main>
  );
}
