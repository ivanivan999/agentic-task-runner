import type { TaskRecord } from "../types";
import { formatChatTimestamp } from "../utils/time";

export function ActivitySidebar({ tasks, isAdmin, onDelete }: { tasks: TaskRecord[]; isAdmin: boolean; onDelete: (task: TaskRecord) => void }) {
  const today = tasks.filter(task => new Date(task.timestamp).toDateString() === new Date().toDateString());
  const earlier = tasks.filter(task => !today.includes(task));
  const group = (label: string, records: TaskRecord[]) => records.length ? <section><h3>{label}</h3>{records.map(task => <div className="activity-item" key={task.id}><a href={`#${task.id}`}><span>{task.input}</span><time dateTime={task.timestamp}>{formatChatTimestamp(task.timestamp)}</time></a>{isAdmin && <button onClick={() => onDelete(task)} aria-label={`Delete ${task.input}`}>×</button>}</div>)}</section> : null;
  return <aside className="sidebar"><div className="sidebar-brand"><span>FR</span><strong>Study journal</strong></div><p>Your local French study history.</p>{group("Today", today)}{group("Earlier", earlier)}{tasks.length === 0 && <div className="sidebar-empty">Your completed study sessions will appear here.</div>}</aside>;
}
