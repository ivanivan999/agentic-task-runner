import { describe, expect, it } from "vitest";
import { AgentController } from "../src/agent/agentController.js";
import { ToolRegistry } from "../src/agent/toolRegistry.js";
import type { TaskRecord } from "../src/types/task.js";
import type { TaskRepository } from "../src/storage/taskRepository.interface.js";

class MemoryRepository implements TaskRepository {
  records: TaskRecord[] = [];
  async save(task: TaskRecord) { this.records.push(task); }
  async getAll() { return this.records; }
  async getById(id: string) { return this.records.find(record => record.id === id); }
}
describe("AgentController", () => {
  it("selects a calculator and builds a four-step trace", async () => {
    const agent = new AgentController(new ToolRegistry(), new MemoryRepository());
    const task = await agent.run("what's 12 * 7");
    expect(task).toMatchObject({ output: "84", toolsUsed: ["CalculatorTool"], status: "success" });
    expect(task.steps).toHaveLength(4);
  });
  it("records a no-match response", async () => {
    const task = await new AgentController(new ToolRegistry(), new MemoryRepository()).run("asdkjhaskjdh");
    expect(task.status).toBe("no_match");
    expect(task.steps.length).toBeGreaterThan(1);
  });
});
