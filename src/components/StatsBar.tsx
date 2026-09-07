import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react'
import type { Task } from '../types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <div className="leading-tight">
        <p className="text-[15px] font-bold text-[var(--color-ink)]">{value}</p>
        <p className="text-[10.5px] font-medium text-[var(--color-ink-faint)]">{label}</p>
      </div>
    </div>
  )
}

export function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress' || t.status === 'in_review').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return differenceInCalendarDays(parseISO(t.due_date), new Date()) < 0
  }).length

  return (
    <div className="flex flex-wrap gap-2">
      <Stat icon={<ListTodo size={14} className="text-[var(--color-brand)]" />} value={total} label="Total tasks" tone="bg-[var(--color-brand-soft)]" />
      <Stat icon={<Clock size={14} className="text-blue-600" />} value={inProgress} label="In flight" tone="bg-blue-50" />
      <Stat icon={<CheckCircle2 size={14} className="text-emerald-600" />} value={done} label="Completed" tone="bg-emerald-50" />
      <Stat icon={<AlertTriangle size={14} className="text-red-600" />} value={overdue} label="Overdue" tone="bg-red-50" />
    </div>
  )
}
