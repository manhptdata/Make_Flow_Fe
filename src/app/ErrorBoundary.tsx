import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/shared/ui/PageState";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Uncaught UI error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="p-6">
        <ErrorState
          problem={{
            title: "Giao diện gặp sự cố",
            status: 500,
            detail:
              "Hãy tải lại trang. Nếu lỗi lặp lại, cung cấp mã đối soát trong Network cho đội phát triển.",
            code: "UI_ERROR",
          }}
          onRetry={() => window.location.reload()}
        />
      </div>
    ) : (
      this.props.children
    );
  }
}
