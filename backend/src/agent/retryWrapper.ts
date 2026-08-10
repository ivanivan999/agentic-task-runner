import type { Tool, ToolResult } from "../tools/tool.interface.js";

export async function executeWithRetry(tool: Tool, input: string, onFailure: (attempt: number, message: string) => void, maxAttempts = 3): Promise<ToolResult> {
  let lastError = "Tool failed.";
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try { return tool.execute(input); }
    catch (error) {
      lastError = error instanceof Error ? error.message : "Unexpected tool failure.";
      onFailure(attempt, lastError);
      if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    }
  }
  throw new Error(lastError);
}
