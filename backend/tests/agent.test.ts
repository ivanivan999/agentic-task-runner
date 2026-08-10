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
  async delete(id: string) { const previous = this.records.length; this.records = this.records.filter(record => record.id !== id); return previous !== this.records.length; }
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
  it("chains two tools and retains ordered tool usage", async () => {
    const task = await new AgentController(new ToolRegistry(), new MemoryRepository()).run("add 5 and 3 then convert to uppercase it");
    expect(task).toMatchObject({ output: "8", toolsUsed: ["CalculatorTool", "TextProcessorTool"], status: "success" });
    expect(task.steps.some(step => step.subTaskIndex === 2)).toBe(true);
  });
  it("splits independent tasks joined by and", async () => {
    const task = await new AgentController(new ToolRegistry(), new MemoryRepository()).run('covert "hello" to uppercase and 5+3=?');
    expect(task).toMatchObject({ toolsUsed: ["TextProcessorTool", "CalculatorTool"], status: "success" });
    expect(task.results?.map(result => result.output)).toEqual(["HELLO", "8"]);
    expect(task.steps.some(step => step.description.includes("detected 2 sub-tasks (independent)"))).toBe(true);
  });
  it("skips a dependent sub-task after an unmatched predecessor", async () => {
    const task = await new AgentController(new ToolRegistry(), new MemoryRepository()).run("say hello, then uppercase it");
    expect(task.status).toBe("no_match");
    expect(task.results?.[1]).toMatchObject({ status: "skipped_dependency", dependsOn: 0 });
  });
  it("retries the explicit flaky weather demo once", async () => {
    const task = await new AgentController(new ToolRegistry(), new MemoryRepository()).run("flaky weather in Ottawa");
    expect(task.status).toBe("success");
    expect(task.steps.some(step => step.description.includes("attempt 1/3"))).toBe(true);
  });
});
