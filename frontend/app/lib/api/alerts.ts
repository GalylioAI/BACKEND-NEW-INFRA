import { apiRequest } from "./client";
import { endpoints } from "./endpoints";
import type {
  Alert,
  AlertRequest,
  AlertType,
  AlertUpdateRequest,
  PaginatedItems,
} from "./types";

export const alertTypeLabels: Record<AlertType, string> = {
  price_drop: "Prix en baisse",
  price_above: "Prix au-dessus",
  back_in_stock: "Retour en stock",
  discount: "Promotion",
};

export function listAlerts(query?: {
  page?: number;
  per_page?: number;
  is_active?: boolean;
  type?: AlertType;
}) {
  return apiRequest<PaginatedItems<Alert>>(endpoints.alerts.collection, {
    method: "GET",
    auth: true,
    query,
  });
}

export function createAlert(payload: AlertRequest) {
  return apiRequest<Alert>(endpoints.alerts.collection, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function getAlert(id: string) {
  return apiRequest<Alert>(endpoints.alerts.item(id), {
    method: "GET",
    auth: true,
  });
}

export function updateAlert(id: string, payload: AlertUpdateRequest) {
  return apiRequest<Alert>(endpoints.alerts.item(id), {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function toggleAlert(id: string, isActive: boolean) {
  return apiRequest<Alert>(endpoints.alerts.toggle(id), {
    method: "PUT",
    auth: true,
    body: { is_active: isActive },
  });
}

export function deleteAlert(id: string) {
  return apiRequest<{ message: string }>(endpoints.alerts.item(id), {
    method: "DELETE",
    auth: true,
  });
}
