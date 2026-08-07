import { useState } from "react";
import type { TaskRecord } from "../types";
import { TraceViewer } from "./TraceViewer";
export function ResultPanel({ task }: { task: TaskRecord }) { const [showTrace, setShowTrace] = useState(true); return <section className="result"><div className="result-heading"><div><span className={`status ${task.status}`}>{task.status.replace("_", " ")}</span><h2>Result</h2></div><time>{new Date(task.timestamp).toLocaleString()}</time></div><pre>{task.output}</pre>{task.toolsUsed.length > 0 && <p className="tools">Tool used: <strong>{task.toolsUsed.join(", ")}</strong></p>}<button className="link-button" onClick={() => setShowTrace(value => !value)}>{showTrace ? "Hide steps" : "View steps"}</button>{showTrace && <TraceViewer task={task}/>}</section>; }
