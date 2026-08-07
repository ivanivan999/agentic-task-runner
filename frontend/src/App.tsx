import { useEffect, useState } from "react";
import { createTask, getTask, getTasks } from "./api/tasksClient";
import { HistoryList } from "./components/HistoryList";
import { ResultPanel } from "./components/ResultPanel";
import { TaskForm } from "./components/TaskForm";
import type { TaskRecord } from "./types";

export default function App() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [selected, setSelected] = useState<TaskRecord>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { getTasks().then(setTasks).catch(() => setError("Could not load task history. Is the API running?")); }, []);
  const submit = async (input: string) => {
    setLoading(true); setError("");
    try { const task = await createTask(input); setSelected(task); setTasks(previous => [task, ...previous]); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not run task."); }
    finally { setLoading(false); }
  };
  const select = async (summary: TaskRecord) => { try { setSelected(await getTask(summary.id)); } catch { setSelected(summary); setError("Could not refresh full task details."); } };
  return <main><header><p className="eyebrow">Deterministic agent demo</p><h1>Agentic Task Runner</h1><p>Give the agent a task. It selects a focused internal tool and shows you exactly how it decided.</p></header><TaskForm onSubmit={submit} loading={loading}/>{error && <p className="error" role="alert">{error}</p>}<div className="workspace"><div>{selected ? <ResultPanel task={selected}/> : <section className="welcome"><h2>Ready when you are</h2><p>Submit a task to see its answer and a transparent execution trace.</p></section>}</div><HistoryList tasks={tasks} selectedId={selected?.id} onSelect={select}/></div></main>;
}
