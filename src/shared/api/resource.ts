import type { ListItem, ListResponse } from "@/shared/types/api";

export interface ResourceQuery {
  resource: string;
  scenario?: string;
}

export interface CreateResourceRequest {
  resource: string;
  body: Pick<ListItem, "name" | "description">;
  idempotencyKey: string;
}

export type ResourceResponse = ListResponse<ListItem>;
