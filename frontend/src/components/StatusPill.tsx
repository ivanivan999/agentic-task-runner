import type { TaskStatus } from "../types";

const labels: Partial<Record<TaskStatus, string>> = { partial: "Partly completed", no_match: "No matching tool", error: "Tool failed" };
export function StatusPill({ status }: { status: TaskStatus }) { const label = labels[status]; return label ? <span className={`status-pill ${status}`}><span aria-hidden="true">{status === "error" ? "!" : "•"}</span>{label}</span> : null; }
