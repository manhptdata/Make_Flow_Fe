import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/shared/ui/Button";

describe("Button", () => {
  it("gọi hành động khi người dùng bấm", async () => {
    const action = vi.fn();
    render(<Button onClick={action}>Lưu</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(action).toHaveBeenCalledOnce();
  });
});
