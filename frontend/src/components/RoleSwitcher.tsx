import type { Role } from "../types";

export function RoleSwitcher({ role, clientId, onChange, onNewUser }: { role: Role; clientId: string; onChange: (role: Role) => void; onNewUser: () => void }) {
  return <section className="role-panel" aria-label="Demo identity controls"><div><span>Demo identity</span><strong>Anonymous user · {clientId.slice(0, 6)}</strong></div><label>Role<select value={role} onChange={event => onChange(event.target.value as Role)}><option value="user">User</option><option value="admin">Admin</option></select></label><button type="button" className="new-user" onClick={onNewUser} title="Generate a new anonymous browser identity">New user</button></section>;
}
