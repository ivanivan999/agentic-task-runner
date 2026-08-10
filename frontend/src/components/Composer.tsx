import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

export function Composer({ onSubmit, loading }: { onSubmit: (input: string) => Promise<void>; loading: boolean }) {
  const [input, setInput] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const send = async () => { if (!input.trim() || loading) return; const value = input; setInput(""); await onSubmit(value); };
  const submit = async (event: FormEvent) => { event.preventDefault(); await send(); };
  const keyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); await send(); } };
  const change = (value: string) => { setInput(value); if (textarea.current) { textarea.current.style.height = "auto"; textarea.current.style.height = `${Math.min(textarea.current.scrollHeight, 150)}px`; } };
  return <form className="composer" onSubmit={submit}><textarea ref={textarea} value={input} onChange={event => change(event.target.value)} onKeyDown={keyDown} placeholder="Ask the agent to do something…" aria-label="Task input" rows={1} disabled={loading}/><button type="submit" disabled={loading || !input.trim()}>{loading ? "Working" : "Run"}<span aria-hidden="true">↵</span></button></form>;
}
