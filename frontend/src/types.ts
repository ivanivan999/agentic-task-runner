export type TaskStatus = "success" | "no_match" | "error";
export interface ExecutionStep { step: number; description: string; }
export interface TaskRecord { id: string; input: string; output: string; toolsUsed: string[]; steps: ExecutionStep[]; timestamp: string; status: TaskStatus; }
