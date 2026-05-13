import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type { Gouvernorat } from "./types";

export async function listGouvernorats() {
  const data = await apiRequest<{ items: Gouvernorat[] } | Gouvernorat[]>(
    endpoints.gouvernorats,
  );
  return Array.isArray(data) ? data : data.items;
}
