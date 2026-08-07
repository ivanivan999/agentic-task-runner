import type { TaskRecord } from "../types/task.js";

export interface TaskRepository {
  save(task: TaskRecord): Promise<void>;
  getAll(): Promise<TaskRecord[]>;
  getById(id: string): Promise<TaskRecord | undefined>;
}
