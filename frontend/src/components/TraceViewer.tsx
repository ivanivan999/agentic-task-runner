import type { TaskRecord } from "../types";
export function TraceViewer({ task }: { task: TaskRecord }) { return <section className="trace"><h3>Agent trace</h3><ol>{task.steps.map(step => <li key={step.step}>{step.description}</li>)}</ol></section>; }
