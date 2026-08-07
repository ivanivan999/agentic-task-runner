import { randomUUID } from "node:crypto";
import type { TaskRecord } from "../types/task.js";
import type { Tool } from "../tools/tool.interface.js";
import type { TaskRepository } from "../storage/taskRepository.interface.js";
import { ToolRegistry } from "./toolRegistry.js";

export class AgentController {
  constructor(private readonly registry: ToolRegistry, private readonly repository: TaskRepository, private readonly threshold = 0.4) {}

  async run(input: string): Promise<TaskRecord> {
    const normalized = input.trim().toLowerCase();
    const steps = [{ step: 1, description: `Received input: "${input.trim()}"` }];
    const candidates = this.registry.getAll().map(tool => ({ tool, confidence: tool.canHandle(normalized) }));
    const winner = candidates.reduce((best, item) => item.confidence > best.confidence ? item : best, { tool: undefined as Tool | undefined, confidence: 0 });
    const base = { id: `task_${randomUUID()}`, input: input.trim(), toolsUsed: [], steps, timestamp: new Date().toISOString() };

    if (!winner.tool || winner.confidence < this.threshold) {
      steps.push({ step: 2, description: `Evaluated ${candidates.length} tools; no tool met the confidence threshold (${this.threshold}).` });
      steps.push({ step: 3, description: "Returning no-match result to user" });
      const task: TaskRecord = { ...base, output: "I couldn't determine a suitable tool for this request", status: "no_match" };
      await this.repository.save(task);
      return task;
    }
    steps.push({ step: 2, description: `Evaluated ${candidates.length} tools, selected ${winner.tool.name} (confidence ${winner.confidence.toFixed(2)})` });
    try {
      const result = winner.tool.execute(input.trim());
      steps.push({ step: 3, description: `Executed ${winner.tool.name} -> "${result.output}"` });
      steps.push({ step: 4, description: "Returning result to user" });
      const task: TaskRecord = { ...base, output: result.output, toolsUsed: [winner.tool.name], status: "success" };
      await this.repository.save(task);
      return task;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected tool failure.";
      steps.push({ step: 3, description: `${winner.tool.name} failed: ${message}` });
      steps.push({ step: 4, description: "Returning error result to user" });
      const task: TaskRecord = { ...base, output: message, toolsUsed: [winner.tool.name], status: "error" };
      await this.repository.save(task);
      return task;
    }
  }
}
