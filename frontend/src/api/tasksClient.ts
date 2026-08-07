import type { TaskRecord } from "../types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}
export const createTask = (input: string) => request<TaskRecord>("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
export const getTasks = () => request<TaskRecord[]>("/api/tasks");
export const getTask = (id: string) => request<TaskRecord>(`/api/tasks/${id}`);
