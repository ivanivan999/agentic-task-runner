import type { TaskRecord } from "../types";

export function HistoryList({ tasks, selectedId, onSelect, onDelete }: { tasks: TaskRecord[]; selectedId?: string; onSelect: (task: TaskRecord) => void; onDelete?: (task: TaskRecord) => void }) {
  return <aside className="history"><h2>History</h2>{tasks.length === 0 ? <p className="empty">No tasks yet. Your completed tasks will appear here.</p> : <ul>{tasks.map(task => <li key={task.id}><div className="history-row"><button className={selectedId === task.id ? "selected" : ""} onClick={() => onSelect(task)}><strong>{task.input}</strong><span>{task.output}</span><time>{new Date(task.timestamp).toLocaleString()}</time></button>{onDelete && <button className="delete" onClick={() => onDelete(task)} aria-label={`Delete ${task.input}`}>Delete</button>}</div></li>)}</ul>}</aside>;
}
