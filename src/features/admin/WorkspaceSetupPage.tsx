import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, CheckCircle2, Factory, MapPin, ShieldCheck, Warehouse } from "lucide-react";
import { useLoginMutation, useProvisionWorkspaceMutation } from "@/features/auth/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
import { toProblemDetail } from "@/shared/lib/errors";

const setupSchema = z
  .object({
    tenant_name: z
      .string()
      .trim()
      .min(1, "Tên cửa hàng / xưởng là bắt buộc")
      .max(150, "Tên tối đa 150 ký tự"),
    tenant_code: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{2,50}$/, "Mã gồm 2–50 ký tự chữ, số, dấu gạch nối (-) hoặc gạch dưới (_)"),
    owner_email: z
      .string()
      .trim()
      .min(1, "Email chủ sở hữu là bắt buộc")
      .email("Email không đúng định dạng")
      .max(254, "Email tối đa 254 ký tự"),
    owner_password: z
      .string()
      .min(6, "Mật khẩu cần ít nhất 6 ký tự")
      .max(72, "Mật khẩu tối đa 72 ký tự"),
    confirm_password: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.owner_password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm_password"],
  });

type SetupFormData = z.infer<typeof setupSchema>;

/** Chuyển tên tiếng Việt có dấu thành mã gợi ý hợp lệ [A-Z0-9_-]{2,50}. */
function suggestTenantCode(name: string): string {
  const ascii = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ascii.slice(0, 50);
}

export default function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const [provisionWorkspace, provisionState] = useProvisionWorkspaceMutation();
  const [login, loginState] = useLoginMutation();

  const [codeEditedManually, setCodeEditedManually] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      tenant_name: "",
      tenant_code: "",
      owner_email: "",
      owner_password: "",
      confirm_password: "",
    },
  });

  const tenantNameField = register("tenant_name");
  const tenantCodeField = register("tenant_code");

  const onSubmit = handleSubmit(async (data) => {
    const normalizedCode = data.tenant_code.trim().toUpperCase();
    const normalizedEmail = data.owner_email.trim().toLowerCase();

    try {
      await provisionWorkspace({
        tenant_code: normalizedCode,
        tenant_name: data.tenant_name.trim(),
        owner_email: normalizedEmail,
        owner_password: data.owner_password,
      }).unwrap();

      setCreatedEmail(normalizedEmail);
      setAutoLoginFailed(false);

      try {
        await login({
          email: normalizedEmail,
          password: data.owner_password,
        }).unwrap();
        navigate("/dashboard", { replace: true });
      } catch {
        // Trường hợp đăng nhập tự động gặp lỗi tạm thời: giữ màn hình báo tạo thành công để user bấm sang Login
        setAutoLoginFailed(true);
      }
    } catch {
      // Problem banner displays API error
    }
  });

  const problem = provisionState.error ? toProblemDetail(provisionState.error) : undefined;
  const isSubmitting = provisionState.isLoading || loginState.isLoading;

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left Intro Panel */}
      <section className="hidden bg-gradient-to-br from-sky-700 to-sky-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-xl font-bold">
          <span className="rounded-xl bg-white/15 p-2">
            <Factory />
          </span>
          MakeFlow
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-100">
              Khởi tạo không gian làm việc
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold leading-tight">
              Sẵn sàng vận hành cửa hàng & xưởng trong một bước.
            </h1>
            <p className="mt-4 max-w-lg text-sky-100">
              Hệ thống sẽ tự động khởi tạo đồng bộ cấu trúc tổ chức ban đầu để bạn có thể bắt đầu nhập kho, cấu hình sản phẩm và bán hàng ngay.
            </p>
          </div>

          <div className="grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
              <MapPin className="h-5 w-5 text-sky-100" />
              <p className="mt-2 font-semibold">Chi nhánh mặc định</p>
              <p className="mt-0.5 text-xs text-sky-100/90">Sẵn sàng bán hàng tại POS và quản lý nhân sự.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
              <Warehouse className="h-5 w-5 text-sky-100" />
              <p className="mt-2 font-semibold">Kho Nguyên liệu & Thành phẩm</p>
              <p className="mt-0.5 text-xs text-sky-100/90">Tách bạch 2 kho lưu trữ chuẩn quy trình sản xuất.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-sky-100">
          <ShieldCheck />
          Tài khoản quản trị cao nhất (Owner) được bảo mật bằng BCrypt và Session CSRF.
        </div>
      </section>

      {/* Right Registration Form */}
      <section className="flex items-center justify-center bg-sky-50/60 p-6">
        <div className="w-full max-w-lg rounded-3xl border border-sky-100 bg-white p-7 shadow-soft sm:p-10">
          <div className="mb-6 lg:hidden">
            <div className="flex items-center gap-2 text-xl font-bold text-sky-700">
              <Factory />
              MakeFlow
            </div>
          </div>

          {createdEmail && autoLoginFailed ? (
            <div className="space-y-5 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tạo không gian làm việc thành công</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Tài khoản quản trị <strong className="text-slate-900">{createdEmail}</strong> cùng chi nhánh và kho mặc định đã sẵn sàng.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Đi tới trang Đăng nhập
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700">
                <Building2 className="h-4 w-4" />
                Đăng ký Workspace mới
              </div>
              <h2 className="mt-1.5 text-2xl font-bold text-slate-900">Tạo tài khoản & Cửa hàng</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Điền thông tin xưởng / cửa hàng và tài khoản quản trị viên đầu tiên.
              </p>

              {problem && (
                <div className="mt-5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700" role="alert">
                  <p className="font-semibold">{problem.title}</p>
                  <p className="mt-0.5">{problem.detail}</p>
                </div>
              )}

              <form className="mt-6 space-y-4" onSubmit={onSubmit}>
                <Input
                  label="Tên cửa hàng / xưởng *"
                  placeholder="VD: Tiệm Bánh Mai Anh"
                  maxLength={150}
                  error={errors.tenant_name?.message}
                  {...tenantNameField}
                  onChange={(e) => {
                    tenantNameField.onChange(e);
                    if (!codeEditedManually) {
                      setValue("tenant_code", suggestTenantCode(e.target.value), {
                        shouldValidate: false,
                      });
                    }
                  }}
                />

                <div>
                  <Input
                    label="Mã không gian làm việc (Tenant Code) *"
                    placeholder="VD: TIEM_BANH_MAI_ANH hoặc MANHPT123"
                    maxLength={50}
                    error={errors.tenant_code?.message}
                    {...tenantCodeField}
                    onChange={(e) => {
                      setCodeEditedManually(e.target.value.trim().length > 0);
                      tenantCodeField.onChange(e);
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    2–50 ký tự chữ không dấu, số, dấu gạch ngang (-) hoặc gạch dưới (_). Tự động viết hoa khi lưu.
                  </p>
                </div>

                <Input
                  label="Email chủ cửa hàng *"
                  type="email"
                  autoComplete="email"
                  placeholder="owner@cuahang.vn"
                  maxLength={254}
                  error={errors.owner_email?.message}
                  {...register("owner_email")}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Mật khẩu *"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ít nhất 6 ký tự"
                    maxLength={72}
                    error={errors.owner_password?.message}
                    {...register("owner_password")}
                  />

                  <Input
                    label="Xác nhận mật khẩu *"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    maxLength={72}
                    error={errors.confirm_password?.message}
                    {...register("confirm_password")}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {provisionState.isLoading
                    ? "Đang khởi tạo không gian làm việc…"
                    : loginState.isLoading
                      ? "Đang đăng nhập…"
                      : "Đăng ký & Bắt đầu sử dụng"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Đã có tài khoản?{" "}
                <Link to="/login" className="font-semibold text-sky-700 hover:text-sky-800 hover:underline">
                  Đăng nhập ngay
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
