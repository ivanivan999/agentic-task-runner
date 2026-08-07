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

  private async read(): Promise<TaskRecord[]> {
    try { return JSON.parse(await readFile(this.filePath, "utf8")) as TaskRecord[]; }
    catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}
