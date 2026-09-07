import { Search, X } from 'lucide-react'
import type { Label, Priority, TeamMember } from '../types'

export interface Filters {
  query: string
  priority: Priority | 'all'
  memberId: string | 'all'
  labelId: string | 'all'
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  members: TeamMember[]
  labels: Label[]
}

export function FilterBar({ filters, onChange, members, labels }: Props) {
  const active = filters.priority !== 'all' || filters.memberId !== 'all' || filters.labelId !== 'all' || filters.query !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
        <input
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          placeholder="Search tasks..."
          className="w-48 rounded-lg border border-[var(--color-border)] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-soft)]"
        />
      </div>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as Filters['priority'] })}
        className="rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[13px] text-[var(--color-ink-soft)] outline-none focus:border-[var(--color-brand)]"
      >
        <option value="all">All priorities</option>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>

      <select
        value={filters.memberId}
        onChange={(e) => onChange({ ...filters, memberId: e.target.value })}
        className="rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[13px] text-[var(--color-ink-soft)] outline-none focus:border-[var(--color-brand)]"
      >
        <option value="all">Everyone</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <select
        value={filters.labelId}
        onChange={(e) => onChange({ ...filters, labelId: e.target.value })}
        className="rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[13px] text-[var(--color-ink-soft)] outline-none focus:border-[var(--color-brand)]"
      >
        <option value="all">All labels</option>
        {labels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      {active && (
        <button
          onClick={() => onChange({ query: '', priority: 'all', memberId: 'all', labelId: 'all' })}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  )
}
