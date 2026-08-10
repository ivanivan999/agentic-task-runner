import { useEffect, useState } from "react";
import type { ExecutionStep, TaskStatus } from "../types";

export function FlightRecorder({ steps, status, tools, live }: { steps: ExecutionStep[]; status: TaskStatus; tools: string[]; live?: boolean }) {
  const [open, setOpen] = useState(status !== "success" || Boolean(live));
  useEffect(() => { if (live || status === "error" || status === "no_match" || status === "partial") setOpen(true); }, [live, status]);
  const toolText = tools.length ? tools.join(", ") : "Routing";
  return <section className={`flight-recorder ${open ? "open" : ""}`}><button className="flight-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}><span className="chevron">›</span><span>Flight Recorder</span><span className="flight-meta">{steps.length} steps · {toolText}{live ? " · live" : ""}</span></button>{open && <ol>{steps.length ? steps.map((step, index) => <li key={`${step.step}-${index}`} style={{ animationDelay: `${index * 80}ms` }}><span>{String(step.step).padStart(2, "0")}</span>{step.description}</li>) : <li className="awaiting"><span>··</span>Awaiting the agent’s first step…</li>}</ol>}</section>;
}
