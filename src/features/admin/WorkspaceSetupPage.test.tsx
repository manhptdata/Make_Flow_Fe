import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { store } from "@/app/store";
import WorkspaceSetupPage from "./WorkspaceSetupPage";

function renderSetupPage() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/setup/workspace"]}>
        <Routes>
          <Route path="/setup/workspace" element={<WorkspaceSetupPage />} />
          <Route path="/dashboard" element={<div>Trang chủ Dashboard</div>} />
          <Route path="/login" element={<div>Trang Đăng nhập</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("WorkspaceSetupPage (Đăng ký Workspace & Chủ xưởng)", () => {
  it("tự gợi ý mã workspace từ tên cửa hàng và kiểm tra lỗi xác nhận mật khẩu", async () => {
    renderSetupPage();

    const nameInput = screen.getByLabelText(/Tên cửa hàng \/ xưởng/i);
    await userEvent.type(nameInput, "Tiệm Bánh Mai Anh");

    const codeInput = screen.getByLabelText(/Mã không gian làm việc/i);
    expect(codeInput).toHaveValue("TIEM_BANH_MAI_ANH");

    await userEvent.type(screen.getByLabelText(/Email chủ cửa hàng/i), "owner@maianh.vn");
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), "123456");
    await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), "654321");

    await userEvent.click(screen.getByRole("button", { name: /Đăng ký & Bắt đầu sử dụng/i }));

    expect(await screen.findByText(/Mật khẩu xác nhận không khớp/i)).toBeInTheDocument();
  });

  it("hiển thị thông báo lỗi 409 từ Backend khi mã workspace đã tồn tại", async () => {
    renderSetupPage();

    await userEvent.type(screen.getByLabelText(/Tên cửa hàng \/ xưởng/i), "Xưởng Trùng Mã");
    const codeInput = screen.getByLabelText(/Mã không gian làm việc/i);
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, "EXISTING_TENANT");

    await userEvent.type(screen.getByLabelText(/Email chủ cửa hàng/i), "new@xuong.vn");
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), "secret123");
    await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), "secret123");

    await userEvent.click(screen.getByRole("button", { name: /Đăng ký & Bắt đầu sử dụng/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Mã không gian làm việc đã tồn tại/i);
  });

  it("tạo workspace thành công, tự động đăng nhập và điều hướng vào Dashboard", async () => {
    renderSetupPage();

    await userEvent.type(screen.getByLabelText(/Tên cửa hàng \/ xưởng/i), "Xưởng Bánh Mới");
    await userEvent.type(screen.getByLabelText(/Email chủ cửa hàng/i), "chu@banhmoi.vn");
    await userEvent.type(screen.getByLabelText(/^Mật khẩu/i), "secret123");
    await userEvent.type(screen.getByLabelText(/Xác nhận mật khẩu/i), "secret123");

    await userEvent.click(screen.getByRole("button", { name: /Đăng ký & Bắt đầu sử dụng/i }));

    await waitFor(() => {
      expect(screen.getByText("Trang chủ Dashboard")).toBeInTheDocument();
    });
  });
});
