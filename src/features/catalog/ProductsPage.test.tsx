import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { store } from "@/app/store";
import ProductsPage from "./ProductsPage";

function renderWithProviders() {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/catalog/products"]}>
        <ProductsPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe("ProductsPage (Mục 010 — Quản lý Sản phẩm & Biến thể Bán hàng)", () => {
  it("hiển thị danh sách sản phẩm cùng biến thể, SKU, barcode và trạng thái có thể bán", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bánh mì hoa cúc bơ Pháp")).toBeInTheDocument();
    expect(screen.getByText("SP-BMHC")).toBeInTheDocument();
    expect(screen.getByText("BMHC-STD")).toBeInTheDocument();
    expect(screen.getByText("8938501234001")).toBeInTheDocument();

    expect(screen.getByText("Nước tinh khiết đóng chai")).toBeInTheDocument();
    expect(screen.getByText("NUOC-500ML")).toBeInTheDocument();
    expect(screen.getByText("8934588012345")).toBeInTheDocument();

    // Có badge trạng thái đủ điều kiện bán
    const saleableBadges = screen.getAllByText("Có thể bán");
    expect(saleableBadges.length).toBeGreaterThanOrEqual(3);
  });

  it("tìm kiếm sản phẩm theo chính xác mã Barcode của biến thể", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bánh mì hoa cúc bơ Pháp")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Tìm tên SP, mã SP, SKU hoặc quét Barcode/i);
    await userEvent.type(searchInput, "8934588012345");

    await waitFor(() => {
      expect(screen.getByText("Nước tinh khiết đóng chai")).toBeInTheDocument();
      expect(screen.queryByText("Bánh mì hoa cúc bơ Pháp")).not.toBeInTheDocument();
    });
  });

  it("chỉ hiển thị mặt hàng Thành phẩm và Hàng thương mại khi mở modal tạo sản phẩm mới", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bánh mì hoa cúc bơ Pháp")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Tạo sản phẩm/i }));

    expect(screen.getByText("Tạo sản phẩm bán hàng mới")).toBeInTheDocument();

    // Kiểm tra dropdown Mặt hàng kho liên kết: chỉ có finished_good & resale_good, KHÔNG có material (Bột mì) hay packaging (Hộp)
    const itemSelect = screen.getByLabelText(/Mặt hàng kho liên kết/i);
    expect(itemSelect).toHaveTextContent(/Bánh mì hoa cúc/);
    expect(itemSelect).toHaveTextContent(/Nước tinh khiết đóng chai 500ml/);
    expect(itemSelect).not.toHaveTextContent(/Bột mì số 13 Meizan/);
    expect(itemSelect).not.toHaveTextContent(/Hộp bánh sinh nhật 20cm/);
  });

  it("tạo sản phẩm mới kèm biến thể và hiển thị trên bảng", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bánh mì hoa cúc bơ Pháp")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Tạo sản phẩm/i }));

    await userEvent.type(screen.getByLabelText(/Mã sản phẩm/i), "SP-CROISSANT");
    await userEvent.type(screen.getByLabelText(/Tên sản phẩm/i), "Bánh sừng bò");
    await userEvent.type(screen.getByLabelText(/Mã SKU biến thể/i), "CROIS-STD");
    await userEvent.type(screen.getByLabelText(/Barcode/i), "893000999111");
    await userEvent.type(screen.getByLabelText(/Tên biến thể/i), "Ổ bơ truyền thống");
    await userEvent.type(screen.getByLabelText(/Giá bán \(trước thuế\)/i), "35000");

    const taxInput = screen.getByLabelText(/Thuế VAT/i);
    await userEvent.clear(taxInput);
    await userEvent.type(taxInput, "8");

    // Kiểm tra preview giá sau thuế: 35000 * 1.08 = 37800 -> "37.800"
    expect(await screen.findByText(/37\.800/)).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^Tạo sản phẩm$/i }));

    // Modal đóng và sản phẩm mới xuất hiện trong danh sách
    expect(await screen.findByText("Bánh sừng bò")).toBeInTheDocument();
    expect(screen.getByText("SP-CROISSANT")).toBeInTheDocument();
    expect(screen.getByText("CROIS-STD")).toBeInTheDocument();
  });

  it("mở Drawer quản lý biến thể và hiển thị chi tiết biến thể của sản phẩm", async () => {
    renderWithProviders();

    expect(await screen.findByText("Bánh mì hoa cúc bơ Pháp")).toBeInTheDocument();

    const variantBtn = screen.getByRole("button", { name: /2 biến thể/i });
    await userEvent.click(variantBtn);

    expect(await screen.findByText(/Biến thể sản phẩm: SP-BMHC/i)).toBeInTheDocument();
    expect(screen.getByText(/Danh sách biến thể \(2\)/i)).toBeInTheDocument();
  });
});
