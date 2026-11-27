import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { store } from "@/app/store";
import ItemsPage from "./ItemsPage";

function renderWithProviders() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/catalog/items"]}>
        <ItemsPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("ItemsPage (Mục 009 — Quản lý Mặt hàng Kho & Quy cách Đóng gói)", () => {
  it("hiển thị danh sách mặt hàng kho với mã SKU, phân loại và đơn vị gốc", async () => {
    renderWithProviders();

    // Chờ danh sách tải xong từ mock handler
    expect(await screen.findByText("Bột mì số 13 Meizan")).toBeInTheDocument();
    expect(screen.getByText("NL-BOT-13")).toBeInTheDocument();
    expect(screen.getByText("Bơ lạt Anchor")).toBeInTheDocument();
    expect(screen.getByText("Hộp bánh sinh nhật 20cm")).toBeInTheDocument();
    expect(screen.getByText("Bánh mì hoa cúc")).toBeInTheDocument();

    // Kiểm tra hiển thị đơn vị gốc và phân loại
    const materialBadges = screen.getAllByText("Nguyên liệu");
    expect(materialBadges.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Bao bì")).toBeInTheDocument();
    expect(screen.getByText("Thành phẩm")).toBeInTheDocument();
  });

  it("lọc danh sách mặt hàng theo phân loại (itemType)", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bột mì số 13 Meizan")).toBeInTheDocument();

    const selects = screen.getAllByRole("combobox");
    const typeSelect = selects[0]; // Select phân loại

    await userEvent.selectOptions(typeSelect, "packaging");

    // Chỉ còn mặt hàng bao bì
    await waitFor(() => {
      expect(screen.getByText("Hộp bánh sinh nhật 20cm")).toBeInTheDocument();
      expect(screen.queryByText("Bột mì số 13 Meizan")).not.toBeInTheDocument();
      expect(screen.queryByText("Bánh mì hoa cúc")).not.toBeInTheDocument();
    });
  });

  it("mở modal tạo mặt hàng mới với các trường bắt buộc", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bột mì số 13 Meizan")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /Thêm mặt hàng/i });
    await userEvent.click(addBtn);

    expect(screen.getByText("Thêm mặt hàng kho mới")).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã mặt hàng \(SKU\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên mặt hàng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phân loại mặt hàng/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Đơn vị gốc/i)).toBeInTheDocument();
  });

  it("mở drawer quy cách đóng gói và thực hiện tính thử xem trước quy đổi", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bột mì số 13 Meizan")).toBeInTheDocument();

    // Mở drawer quy cách của Bột mì (có sẵn 1 quy cách trong mock data)
    const packagingBtn = screen.getByRole("button", { name: /1 quy cách/i });
    await userEvent.click(packagingBtn);

    // Tiêu đề drawer
    expect(await screen.findByText(/Quy cách đóng gói: NL-BOT-13/i)).toBeInTheDocument();
    expect(screen.getByText(/Thêm quy cách đóng gói mới/i)).toBeInTheDocument();
    expect(screen.getByText(/Xem trước quy đổi bao gói/i)).toBeInTheDocument();

    // Bấm nút tính xem trước quy đổi (Thử quy đổi)
    const calcBtn = screen.getByRole("button", { name: /Thử quy đổi/i });
    await userEvent.click(calcBtn);

    // Kiểm tra kết quả xem trước xuất hiện (1 bao x 25 = 25 kg)
    expect(await screen.findByText(/Kết quả quy đổi chuẩn/i)).toBeInTheDocument();
    expect(screen.getAllByText(/25/).length).toBeGreaterThanOrEqual(1);
  });
});
