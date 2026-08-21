import { randomUUID } from "node:crypto";
import type {
  ExecutionStep,
  SubTaskResult,
  SubTaskStatus,
  TaskRecord,
  TaskStatus,
} from "../types/task.js";
import type { Tool } from "../tools/tool.interface.js";
import type { TaskRepository } from "../storage/taskRepository.interface.js";
import { executeWithRetry } from "./retryWrapper.js";
import { resolvePreviousResult, splitIntoSubTasks } from "./subTaskSplitter.js";
import { ToolRegistry } from "./toolRegistry.js";

export interface RunOptions {
  id?: string;
  ownerId?: string;
  onStep?: (step: ExecutionStep) => void;
  stepDelayMs?: number;
}
interface Outcome {
  status: "success" | "no_match" | "error";
  output: string;
  tool?: Tool;
}
const referencesPrevious = (text: string) =>
  /\b(it|that|this|the result)\b/i.test(text);

export class AgentController {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly repository: TaskRepository,
    private readonly threshold = 0.4,
  ) {}

  async run(input: string, options: RunOptions = {}): Promise<TaskRecord> {
    return this.runChain(input, options);
  }

  private async runChain(
    input: string,
    options: RunOptions,
  ): Promise<TaskRecord> {
    const steps: ExecutionStep[] = [];
    const addStep = (description: string, subTaskIndex?: number) => {
      const step = {
        step: steps.length + 1,
        description,
        ...(subTaskIndex ? { subTaskIndex } : {}),
      };
      steps.push(step);
      options.onStep?.(step);
    };
    const base = {
      id: options.id ?? `task_${randomUUID()}`,
      input: input.trim(),
      toolsUsed: [],
      steps,
      timestamp: new Date().toISOString(),
      ownerId: options.ownerId ?? "local-user",
    };
    const canHandle = (text: string) =>
      this.registry
        .getAll()
        .some(
          (tool) => tool.canHandle(text.toLowerCase().trim()) >= this.threshold,
        );
    const texts = splitIntoSubTasks(input, canHandle);
    const subTasks = texts.map((text, index) => ({
      text,
      dependsOn: index > 0 && referencesPrevious(text) ? index - 1 : undefined,
    }));
    const pause = async (): Promise<void> => {
      if (options.stepDelayMs)
        await new Promise<void>((resolve) =>
          setTimeout(resolve, options.stepDelayMs),
        );
    };
    const dependentCount = subTasks.filter(
      (task) => task.dependsOn !== undefined,
    ).length;
    addStep(
      `Received input: "${input.trim()}"${subTasks.length > 1 ? `; detected ${subTasks.length} sub-tasks${dependentCount ? ` (${dependentCount} dependent)` : " (independent)"}.` : ""}`,
    );
    await pause();

    const results: SubTaskResult[] = [];
    const toolsUsed: string[] = [];
    for (const [index, subTask] of subTasks.entries()) {
      const number = index + 1;
      const dependency =
        subTask.dependsOn === undefined
          ? undefined
          : results[subTask.dependsOn];
      if (subTask.dependsOn !== undefined && dependency?.status !== "success") {
        results.push({
          index,
          input: subTask.text,
          status: "skipped_dependency",
          dependsOn: subTask.dependsOn,
        });
        addStep(
          `Sub-task ${number}: skipped - dependency (sub-task ${subTask.dependsOn + 1}) did not produce a result.`,
          number,
        );
        await pause();
        continue;
      }
      const resolvedInput =
        subTask.dependsOn === undefined
          ? subTask.text
          : resolvePreviousResult(subTask.text, dependency?.output);
      if (subTasks.length > 1) {
        addStep(
          `Sub-task ${number}/${subTasks.length}: "${resolvedInput}"${subTask.dependsOn !== undefined ? ` depends on sub-task ${subTask.dependsOn + 1}.` : ""}`,
          number,
        );
        await pause();
      }
      const outcome = await this.selectAndExecute(
        resolvedInput,
        number,
        addStep,
        pause,
      );
      results.push({
        index,
        input: resolvedInput,
        status: outcome.status,
        ...(outcome.tool ? { toolUsed: outcome.tool.name } : {}),
        ...(outcome.status === "success" ? { output: outcome.output } : {}),
        ...(subTask.dependsOn !== undefined
          ? { dependsOn: subTask.dependsOn }
          : {}),
      });
      if (outcome.tool) toolsUsed.push(outcome.tool.name);
    }

    const completed = results.filter((result) => result.status === "success");
    const failed = results.filter((result) => result.status !== "success");
    const status: TaskStatus =
      failed.length === 0
        ? "success"
        : completed.length > 0
          ? "partial"
          : results.find((result) => result.status === "error")
            ? "error"
            : "no_match";
    const hasDependency = subTasks.some((task) => task.dependsOn !== undefined);
    const output = this.composeOutput(results, hasDependency, status);
    if (subTasks.length > 1 && !hasDependency && completed.length > 0)
      addStep(
        `Combined ${completed.length} independent result${completed.length === 1 ? "" : "s"}.`,
      );
    addStep("Returning result to user");
    const task: TaskRecord = {
      ...base,
      toolsUsed,
      output,
      status,
      ...(subTasks.length > 1 ? { results } : {}),
    };
    await this.repository.save(task);
    return task;
  }

  private composeOutput(
    results: SubTaskResult[],
    hasDependency: boolean,
    status: TaskStatus,
  ): string {
    if (results.length === 1)
      return (
        results[0].output ??
        (results[0].status === "error"
          ? "The tool could not complete this request."
          : "I couldn't determine a suitable tool for this request")
      );
    if (!hasDependency)
      return results
        .map((result) =>
          result.status === "success"
            ? `${result.input} = ${result.output}`
            : `${result.input} = ${result.status === "error" ? "failed" : "no match"}`,
        )
        .join("; ");
    const last = results.at(-1);
    if (status === "success") return last?.output ?? "";
    const failed = results.find((result) => result.status !== "success");
    return failed?.status === "skipped_dependency"
      ? `A dependent step was skipped because its prior result was unavailable.`
      : `The chain could not complete: ${failed?.input ?? "unknown sub-task"}.`;
  }

  private async selectAndExecute(
    input: string,
    subTaskIndex: number,
    addStep: (description: string, subTaskIndex?: number) => void,
    pause: () => Promise<void>,
  ): Promise<Outcome> {
    const candidates = this.registry.getAll().map((tool) => ({
      tool,
      confidence: tool.canHandle(input.toLowerCase().trim()),
    }));
    const winner = candidates.reduce(
      (best, item) => (item.confidence > best.confidence ? item : best),
      { tool: undefined as Tool | undefined, confidence: 0 },
    );
    if (!winner.tool || winner.confidence < this.threshold) {
      addStep(
        `Sub-task ${subTaskIndex}: evaluated ${candidates.length} tools; no tool met the confidence threshold (${this.threshold}).`,
        subTaskIndex,
      );
      return {
        status: "no_match",
        output: "I couldn't determine a suitable tool for this request",
      };
    }
    const tool = winner.tool;
    addStep(
      `Sub-task ${subTaskIndex}: selected ${tool.name} (confidence ${winner.confidence.toFixed(2)}).`,
      subTaskIndex,
    );
    await pause();
    try {
      const result = await executeWithRetry(tool, input, (attempt, message) =>
        addStep(
          `Sub-task ${subTaskIndex}: attempt ${attempt}/3 for ${tool.name} failed - ${message}`,
          subTaskIndex,
        ),
      );
      addStep(
        `Sub-task ${subTaskIndex}: executed ${tool.name} -> "${result.output}"`,
        subTaskIndex,
      );
      await pause();
      return { status: "success", output: result.output, tool };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected tool failure.";
      addStep(
        `Sub-task ${subTaskIndex}: ${tool.name} exhausted retries.`,
        subTaskIndex,
      );
      return { status: "error", output: message, tool };
    }
  }
}
