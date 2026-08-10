import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TaskRecord } from "../types/task.js";
import type { TaskRepository } from "./taskRepository.interface.js";

export class JsonFileTaskRepository implements TaskRepository {
  constructor(private readonly filePath: string) {}

  async save(task: TaskRecord): Promise<void> {
    const tasks = await this.read();
    tasks.push(task);
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(tasks, null, 2) + "\n", "utf8");
  }
  async getAll(): Promise<TaskRecord[]> { return (await this.read()).sort((a, b) => b.timestamp.localeCompare(a.timestamp)); }
  async getById(id: string): Promise<TaskRecord | undefined> { return (await this.read()).find(task => task.id === id); }
  async delete(id: string): Promise<boolean> {
    const tasks = await this.read();
    const filtered = tasks.filter(task => task.id !== id);
    if (filtered.length === tasks.length) return false;
    await writeFile(this.filePath, JSON.stringify(filtered, null, 2) + "\n", "utf8");
    return true;
  }

  private async read(): Promise<TaskRecord[]> {
    try {
      const tasks = JSON.parse(await readFile(this.filePath, "utf8")) as Array<Partial<TaskRecord>>;
      // Keep records created before role-scoping visible to the original local user.
      return tasks.map(task => ({ ...task, ownerId: task.ownerId ?? "local-user" })) as TaskRecord[];
    }
    catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}
