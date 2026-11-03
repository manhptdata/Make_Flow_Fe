import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ProblemDetail } from "@/shared/types/api";

const fallback: ProblemDetail = {
  title: "Không thể xử lý yêu cầu",
  status: 500,
  detail: "Đã có lỗi không mong muốn. Vui lòng thử lại.",
  code: "UNEXPECTED_ERROR",
};

export function toProblemDetail(error: unknown): ProblemDetail {
  if (!error || typeof error !== "object") return fallback;
  const apiError = error as FetchBaseQueryError;
  if (typeof apiError.status === "number" && apiError.data && typeof apiError.data === "object") {
    const problem = apiError.data as Partial<ProblemDetail>;
    return {
      title: problem.title ?? fallback.title,
      status: problem.status ?? apiError.status,
      detail: problem.detail ?? fallback.detail,
      code: problem.code ?? "API_ERROR",
      correlation_id: problem.correlation_id,
      errors: problem.errors,
    };
  }
  return fallback;
}
