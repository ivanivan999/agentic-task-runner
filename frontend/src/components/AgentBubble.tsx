import type { TaskRecord } from "../types";
import { FlightRecorder } from "./FlightRecorder";
import { StatusPill } from "./StatusPill";

export function AgentBubble({ task, live }: { task: TaskRecord; live?: boolean }) {
  const results = task.results;
  return <article className={`message agent-message ${live ? "thinking" : ""}`}><div className="avatar" aria-hidden="true">F</div><div className="agent-content"><div className="message-label">French tutor {live && <span className="live-label">working</span>}<StatusPill status={task.status}/></div><div className="agent-answer">{results?.length ? <div className="task-results">{results.map(result => <div key={result.index}><span>Sub-task {result.index + 1}</span><strong>{result.status === "success" ? result.output : result.status.replace("_", " ")}</strong></div>)}</div> : <pre>{task.output}</pre>}</div>{task.toolsUsed.length > 0 && <div className="tool-badges">{task.toolsUsed.map(tool => <span key={tool}>{tool}</span>)}</div>}<FlightRecorder steps={task.steps} status={task.status} tools={task.toolsUsed} live={live}/></div></article>;
}
