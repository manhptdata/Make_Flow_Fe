import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { store } from "@/app/store";
import RecipesPage from "@/features/recipes/RecipesPage";
import { ResourceWorkspace } from "@/shared/ui/ResourceWorkspace";
import type { ListItem } from "@/shared/types/api";

const posted: ListItem = {
  id: "posted-1",
  code: "GR-001",
  name: "Phiếu đã ghi sổ",
  status: "posted",
  updated_at: new Date().toISOString(),
};

describe("I/O edge cases", () => {
  it("hiển thị as_of, nguyên liệu giới hạn và không coi dữ liệu thiếu là 0", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/estimates"]}>
          <RecipesPage />
        </MemoryRouter>
      </Provider>,
    );
    expect(await screen.findByText(/Nguyên liệu giới hạn: Bơ lạt/)).toBeInTheDocument();
    expect(screen.getByText(/không được tự động coi là 0/)).toBeInTheDocument();
    expect(screen.getByText(/Dữ liệu tại/)).toBeInTheDocument();
  });

  it("khóa ngữ nghĩa sửa trực tiếp đối với chứng từ đã ghi sổ", async () => {
    render(
      <Provider store={store}>
        <ResourceWorkspace
          resource="inventory/receipts"
          title="Phiếu nhập"
          description="Kiểm tra bất biến"
          query={{
            data: { data: [posted], total: 1 },
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          }}
        />
      </Provider>,
    );
    await userEvent.click(screen.getByText("Phiếu đã ghi sổ"));
    expect(screen.getByText(/chứng từ bù trừ, không sửa trực tiếp/)).toBeInTheDocument();
  });

  it("bảng luôn có vùng cuộn ngang để không làm mất cột trên mobile", () => {
    const { container } = render(
      <Provider store={store}>
        <ResourceWorkspace
          resource="catalog/items"
          title="Nguyên liệu"
          description="Kiểm tra responsive"
          readOnly
          query={{
            data: { data: [posted], total: 1 },
            isLoading: false,
            isFetching: false,
            refetch: vi.fn(),
          }}
        />
      </Provider>,
    );
    expect(container.querySelector(".overflow-x-auto")).toBeInTheDocument();
  });
});
