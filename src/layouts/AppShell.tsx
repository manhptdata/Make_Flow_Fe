import { useState } from "react";
import { Bell, ChevronDown, Factory, LogOut, Menu, Search, X } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { navigation } from "@/layouts/navigation";
import { Button } from "@/shared/ui/Button";
import { useGetSessionQuery, useLogoutMutation } from "@/features/auth/api";

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useGetSessionQuery();
  const [logout] = useLogoutMutation();
  const scenario = new URLSearchParams(location.search).get("scenario") ?? "success";
  const changeScenario = (value: string) => {
    const params = new URLSearchParams(location.search);
    if (value === "success") params.delete("scenario");
    else params.set("scenario", value);
    navigate({ pathname: location.pathname, search: params.toString() });
  };
  const signOut = async () => {
    await logout();
    navigate("/login");
  };
  return (
    <div className="min-h-screen">
      <div
        className={`fixed inset-0 z-30 bg-slate-950/35 transition lg:hidden ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sky-100 bg-white transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-sky-100 px-5">
          <span className="rounded-xl bg-sky-600 p-2 text-white">
            <Factory className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold text-sky-700">MakeFlow</p>
            <p className="text-[11px] text-slate-400">Production · Inventory · POS</p>
          </div>
          <button className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold">{session?.workspace.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{session?.workspace.branch_name}</p>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-sky-100 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Menu />
          </button>
          <label className="relative hidden max-w-sm flex-1 md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className="field bg-slate-50 pl-9" placeholder="Tìm nhanh tính năng…" />
          </label>
          {import.meta.env.VITE_ENABLE_MOCKS === "true" && (
            <select
              aria-label="Kịch bản mock"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
              value={scenario}
              onChange={(event) => changeScenario(event.target.value)}
            >
              <option value="success">Mock: Thành công</option>
              <option value="empty">Mock: Rỗng</option>
              <option value="error">Mock: Lỗi 500</option>
              <option value="forbidden">Mock: Cấm 403</option>
              <option value="conflict">Mock: Xung đột 409</option>
            </select>
          )}
          <button className="ml-auto rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
          </button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold">{session?.full_name}</p>
            <p className="text-xs capitalize text-slate-500">{session?.role}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
            {session?.full_name?.slice(0, 1)}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut} title="Đăng xuất">
            <LogOut className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </Button>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
