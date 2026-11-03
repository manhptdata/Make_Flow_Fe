export type EntityStatus = "active" | "draft" | "posted" | "completed" | "rejected" | "pending";

export interface ListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: EntityStatus;
  quantity?: string;
  unit?: string;
  amount?: string;
  updated_at: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  correlation_id?: string;
  errors?: Array<{ field?: string; code: string; message: string }>;
}

export interface SessionUser {
  id: string;
  full_name: string;
  email: string;
  role: "owner" | "manager" | "producer" | "cashier";
  permissions: string[];
  workspace: { id: string; name: string; branch_name: string };
}
