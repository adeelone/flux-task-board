import { useState } from 'react'
import { Plus, Trash2, Users, X } from 'lucide-react'
import type { TeamMember } from '../types'
import { Avatar } from './AvatarStack'

const COLORS = ['#5b5bf6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#0ea5e9']

interface Props {
  members: TeamMember[]
  onCreate: (name: string, color: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TeamPanel({ members, onCreate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await onCreate(name.trim(), color)
      setName('')
      setColor(COLORS[(members.length + 1) % COLORS.length])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-border-strong)]"
      >
        <Users size={14} />
        <div className="flex -space-x-1.5">
          {members.slice(0, 4).map((m) => (
            <Avatar key={m.id} member={m} size={18} />
          ))}
        </div>
        Team
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-[var(--color-border)] bg-white p-3 shadow-xl animate-pop-in">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">Team members</h3>
            <button onClick={() => setOpen(false)} className="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
              <X size={14} />
            </button>
          </div>

          <div className="mb-3 max-h-40 space-y-1 overflow-y-auto scrollbar-thin">
            {members.length === 0 && <p className="text-[12px] text-[var(--color-ink-faint)]">No team members yet.</p>}
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-1.5 py-1 hover:bg-[var(--color-surface-2)]">
                <div className="flex items-center gap-2">
                  <Avatar member={m} size={20} />
                  <span className="text-[12.5px] text-[var(--color-ink)]">{m.name}</span>
                </div>
                <button onClick={() => onDelete(m.id)} className="text-[var(--color-ink-faint)] hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-[var(--color-border)] pt-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Member name"
              className="w-full rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--color-brand)]"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-5 w-5 rounded-full ${color === c ? 'ring-2 ring-offset-1 ring-[var(--color-brand)]' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                disabled={busy || !name.trim()}
                onClick={handleAdd}
                className="flex items-center gap-1 rounded-lg bg-[var(--color-brand)] px-2.5 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
