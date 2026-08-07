export interface ToolResult { output: string; }

export interface Tool {
  readonly name: string;
  readonly description: string;
  canHandle(input: string): number;
  execute(input: string): ToolResult;
}
