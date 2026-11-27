import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { store } from "@/app/store";
import UnitsPage from "./UnitsPage";

function renderWithProviders() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/catalog/units"]}>
        <UnitsPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("UnitsPage (Mục 008 — Quản lý Đơn vị tính & Quy đổi)", () => {
  it("hiển thị danh sách các đơn vị tính ban đầu với nhóm đại lượng", async () => {
    renderWithProviders();

    // Chờ danh sách tải xong từ mock handler
    expect(await screen.findByText("Kilogram")).toBeInTheDocument();
    expect(screen.getByText("KG")).toBeInTheDocument();
    expect(screen.getByText("Gram")).toBeInTheDocument();
    expect(screen.getByText("Lít")).toBeInTheDocument();
    expect(screen.getByText("Chiếc")).toBeInTheDocument();

    // Hiển thị badge đơn vị chuẩn
    const baseBadges = screen.getAllByText("Đơn vị chuẩn");
    expect(baseBadges.length).toBeGreaterThan(0);
  });

  it("lọc danh sách đơn vị tính theo nhóm đại lượng", async () => {
    renderWithProviders();

    expect(await screen.findByText("Kilogram")).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    const dimensionSelect = selects[0]; // Select đại lượng

    await userEvent.selectOptions(dimensionSelect, "mass");

    // Chỉ còn các đơn vị nhóm mass
    await waitFor(() => {
      expect(screen.getByText("Kilogram")).toBeInTheDocument();
      expect(screen.getByText("Gram")).toBeInTheDocument();
      expect(screen.queryByText("Chiếc")).not.toBeInTheDocument();
    });
  });

  it("xem trước quy đổi đơn vị thành công (Conversion Preview)", async () => {
    renderWithProviders();

    expect(await screen.findByText("Kilogram")).toBeInTheDocument();

    // Mở modal xem trước quy đổi
    const previewBtn = screen.getByRole("button", { name: /Xem trước quy đổi/i });
    await userEvent.click(previewBtn);

    expect(screen.getByText("Thử nghiệm Quy đổi Đơn vị (Preview)")).toBeInTheDocument();

    // Nhập số lượng và thực hiện quy đổi
    const quantityInput = screen.getByLabelText(/Số lượng cần quy đổi/i);
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, "2500");

    const convertBtn = screen.getByRole("button", { name: /Thực hiện quy đổi/i });
    await userEvent.click(convertBtn);

    // Kiểm tra kết quả xem trước xuất hiện
    expect(await screen.findByText(/Kết quả xem trước/i)).toBeInTheDocument();
  });

  it("mở modal tạo đơn vị tính mới và khóa ratio khi tick Base Unit", async () => {
    renderWithProviders();

    expect(await screen.findByText("Kilogram")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /Thêm đơn vị/i });
    await userEvent.click(addBtn);

    expect(screen.getByText("Thêm đơn vị tính mới")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã đơn vị/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ký hiệu/i)).toBeInTheDocument();

    const baseCheckbox = screen.getByLabelText(/Đặt làm Đơn vị cơ sở/i);
    expect(baseCheckbox).not.toBeChecked();

    // Ô nhập ratio hiển thị và mặc định rỗng khi tạo mới đơn vị phụ (tránh lưu nhầm = 1)
    const ratioInput = screen.getByLabelText(/Hệ số quy đổi về đơn vị chuẩn/i);
    expect(ratioInput).toBeInTheDocument();
    expect(ratioInput).toHaveValue("");

    // Tick base checkbox -> trường ratio ẩn đi vì mặc định cố định = 1
    await userEvent.click(baseCheckbox);
    expect(screen.queryByLabelText(/Hệ số quy đổi về đơn vị chuẩn/i)).not.toBeInTheDocument();
  });
});

