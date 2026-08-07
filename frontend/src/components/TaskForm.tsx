import { useState, type FormEvent } from "react";
export function TaskForm({ onSubmit, loading }: { onSubmit: (input: string) => Promise<void>; loading: boolean }) {
  const [input, setInput] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!input.trim()) return; await onSubmit(input); setInput(""); };
  return <form className="task-form" onSubmit={submit}><label htmlFor="task">What would you like me to do?</label><div><input id="task" value={input} onChange={event => setInput(event.target.value)} placeholder="e.g. Convert to uppercase: hello" disabled={loading}/><button disabled={loading || !input.trim()}>{loading ? "Running…" : "Run task"}</button></div><p>Try text processing, a simple calculation, or “weather in Ottawa”.</p></form>;
}
