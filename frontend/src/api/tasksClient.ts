import type { Role, TaskRecord } from "../types";

export interface ClientContext { role: Role; clientId: string; }
const headers = (context: ClientContext) => ({ "Content-Type": "application/json", "X-Role": context.role, "X-Client-Id": context.clientId });
async function request<T>(path: string, context: ClientContext, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { ...headers(context), ...options?.headers } });
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}
export const createTask = (input: string, context: ClientContext) => request<{ id: string; status: "pending" }>("/api/tasks", context, { method: "POST", body: JSON.stringify({ input }) });
export const getTasks = (context: ClientContext) => request<TaskRecord[]>(`/api/tasks${context.role === "admin" ? "?scope=all" : ""}`, context);
export const getTask = (id: string, context: ClientContext) => request<TaskRecord>(`/api/tasks/${id}`, context);
export const deleteTask = (id: string, context: ClientContext) => request<void>(`/api/tasks/${id}`, context, { method: "DELETE" });
export const streamTask = (id: string, context: ClientContext) => new EventSource(`/api/tasks/${id}/stream?role=${context.role}&clientId=${encodeURIComponent(context.clientId)}`);
