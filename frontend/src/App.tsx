import { useEffect, useMemo, useRef, useState } from "react";
import { createTask, deleteTask, getTasks, streamTask, type ClientContext } from "./api/tasksClient";
import { ActivitySidebar } from "./components/ActivitySidebar";
import { AgentBubble } from "./components/AgentBubble";
import { Composer } from "./components/Composer";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { UserBubble } from "./components/UserBubble";
import type { ExecutionStep, Role, TaskRecord } from "./types";
import { formatChatTimestamp } from "./utils/time";

const clientIdKey = "agentic-task-runner-client-id";
const getClientId = () => { const existing = localStorage.getItem(clientIdKey); if (existing) return existing; const id = crypto.randomUUID(); localStorage.setItem(clientIdKey, id); return id; };

export default function App() {
  const [role, setRole] = useState<Role>("user"); const [clientId, setClientId] = useState(getClientId);
  const context = useMemo<ClientContext>(() => ({ role, clientId }), [role, clientId]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]); const [pendingInput, setPendingInput] = useState<string>(); const [liveSteps, setLiveSteps] = useState<ExecutionStep[]>([]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(""); const endOfThread = useRef<HTMLDivElement>(null);
  const load = () => getTasks(context).then(records => setTasks([...records].reverse())).catch(() => setError("Could not load task history. Is the API running?"));
  useEffect(() => { load(); }, [context]);
  useEffect(() => { endOfThread.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [tasks, pendingInput, liveSteps]);
  const submit = async (input: string) => {
    setLoading(true); setError(""); setPendingInput(input); setLiveSteps([]);
    try {
      const pending = await createTask(input, context); const stream = streamTask(pending.id, context);
      stream.onmessage = event => setLiveSteps(previous => [...previous, JSON.parse(event.data) as ExecutionStep]);
      stream.addEventListener("done", event => { const task = JSON.parse((event as MessageEvent).data) as TaskRecord; stream.close(); setTasks(previous => [...previous, task]); setPendingInput(undefined); setLiveSteps([]); setLoading(false); });
      stream.onerror = () => { stream.close(); setLoading(false); setError("The live trace connection ended unexpectedly."); };
    } catch (reason) { setLoading(false); setError(reason instanceof Error ? reason.message : "Could not run task."); }
  };
  const remove = async (task: TaskRecord) => { try { await deleteTask(task.id, context); setTasks(previous => previous.filter(item => item.id !== task.id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete task."); } };
  const newUser = () => { const id = crypto.randomUUID(); localStorage.setItem(clientIdKey, id); setClientId(id); setRole("user"); setError(""); };
  const latestLiveStep = liveSteps[liveSteps.length - 1];
  const liveTask: TaskRecord | undefined = pendingInput ? { id: "live", input: pendingInput, output: latestLiveStep?.description ?? "Selecting a tool…", toolsUsed: [], steps: liveSteps, timestamp: new Date().toISOString(), status: "pending", ownerId: clientId } : undefined;
  return <div className="app-shell"><ActivitySidebar tasks={tasks} isAdmin={role === "admin"} onDelete={remove}/><main className="chat"><header className="chat-header"><a className="wordmark" href="/">Agentic Task Runner</a><RoleSwitcher role={role} clientId={clientId} onChange={setRole} onNewUser={newUser}/></header><section className="thread" role="log" aria-live="polite">{tasks.length === 0 && !pendingInput && <div className="empty-state"><h1>What should I run?</h1><p>Try a calculation, some text processing, or a city’s weather.</p></div>}{tasks.map(task => <div className="turn" id={task.id} key={task.id}><time className="turn-timestamp" dateTime={task.timestamp}>{formatChatTimestamp(task.timestamp)}</time><UserBubble input={task.input}/><AgentBubble task={task}/></div>)}{pendingInput && <div className="turn live-turn"><time className="turn-timestamp" dateTime={liveTask?.timestamp}>{liveTask && formatChatTimestamp(liveTask.timestamp)}</time><UserBubble input={pendingInput} live/>{liveTask && <AgentBubble task={liveTask} live/>}</div>}<div ref={endOfThread}/></section>{error && <p className="error" role="alert">{error}</p>}<footer className="composer-area"><Composer onSubmit={submit} loading={loading}/><p>Each task runs independently. <span>Flight Recorder shows the routing trace.</span></p></footer></main></div>;
}
