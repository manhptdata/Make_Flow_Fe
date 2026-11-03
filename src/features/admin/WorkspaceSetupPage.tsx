import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, MapPin, Warehouse } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Field";
export default function WorkspaceSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-soft sm:p-9">
        <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
          Thiết lập ban đầu · Bước {step}/3
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {step === 1
            ? "Thông tin không gian làm việc"
            : step === 2
              ? "Chi nhánh và kho mặc định"
              : "Sẵn sàng vận hành"}
        </h1>
        <div className="my-7 flex gap-2">
          {[1, 2, 3].map((item) => (
            <span
              key={item}
              className={`h-2 flex-1 rounded-full ${item <= step ? "bg-sky-600" : "bg-slate-100"}`}
            />
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-4">
            <Input label="Tên cửa hàng / doanh nghiệp" defaultValue="MakeFlow Demo" />
            <Input label="Loại hình" defaultValue="Sản xuất và bán lẻ" />
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-100 p-4">
              <MapPin className="text-sky-600" />
              <p className="mt-3 font-semibold">Chi nhánh trung tâm</p>
              <p className="text-sm text-slate-500">Nơi bán hàng mặc định</p>
            </div>
            <div className="rounded-2xl border border-sky-100 p-4">
              <Warehouse className="text-sky-600" />
              <p className="mt-3 font-semibold">Kho trung tâm</p>
              <p className="text-sm text-slate-500">Lưu nguyên liệu và thành phẩm</p>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check />
            </span>
            <p className="mt-4 font-bold text-emerald-800">Không gian làm việc đã sẵn sàng</p>
            <p className="mt-1 text-sm text-emerald-700">
              Bạn có thể bắt đầu tạo đơn vị tính và nguyên liệu.
            </p>
          </div>
        )}
        <div className="mt-8 flex justify-between">
          <Button variant="secondary" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>
            Quay lại
          </Button>
          <Button onClick={() => (step < 3 ? setStep((value) => value + 1) : navigate("/dashboard"))}>
            {step === 3 ? (
              <>
                <Building2 className="h-4 w-4" />
                Vào MakeFlow
              </>
            ) : (
              "Tiếp tục"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
