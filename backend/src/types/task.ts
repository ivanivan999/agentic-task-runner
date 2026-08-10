export type TaskStatus = "pending" | "success" | "partial" | "no_match" | "error";
export type SubTaskStatus = "success" | "no_match" | "error" | "skipped_dependency";

export interface ExecutionStep { step: number; description: string; subTaskIndex?: number; }
export interface SubTaskResult {
  index: number;
  input: string;
  status: SubTaskStatus;
  toolUsed?: string;
  output?: string;
  dependsOn?: number;
}

export interface TaskRecord {
  id: string;
  input: string;
  output: string;
  toolsUsed: string[];
  steps: ExecutionStep[];
  timestamp: string;
  status: TaskStatus;
  ownerId: string;
  results?: SubTaskResult[];
}

export interface ToolInfo { name: string; description: string; }
